import uuid
import time
import requests
from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.voting_session import VotingSession, JiraIssue, Vote

jira_bp = Blueprint('jira', __name__)

def get_fibonacci_sequence(max_value=100):
    """Generate Fibonacci sequence up to max_value"""
    fib = [1, 2]
    while fib[-1] < max_value:
        fib.append(fib[-1] + fib[-2])
    return fib

def find_closest_fibonacci(value):
    """Find the closest Fibonacci number to the given value.
    If exactly between two Fibonacci numbers, return the higher one."""
    fib_sequence = get_fibonacci_sequence()

    if value <= 1:
        return 1

    for i, fib_value in enumerate(fib_sequence):
        if fib_value == value:
            return fib_value
        elif fib_value > value:
            if i == 0:
                return fib_value

            lower_fib = fib_sequence[i-1]
            upper_fib = fib_value

            # Calculate distances
            lower_distance = abs(value - lower_fib)
            upper_distance = abs(value - upper_fib)

            # If exactly in between, use higher number
            if lower_distance == upper_distance:
                return upper_fib
            elif lower_distance < upper_distance:
                return lower_fib
            else:
                return upper_fib

    # If value is larger than all Fibonacci numbers in sequence
    return fib_sequence[-1]

def update_jira_custom_field(jira_url, token, issue_key, field_value, retries=2, delay=1):
    """Update Jira issue custom field customfield_12310243 with retries"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    jira_url = jira_url.rstrip('/')
    update_url = f"{jira_url}/rest/api/2/issue/{issue_key}"

    payload = {
        "fields": {
            "customfield_12310243": field_value
        }
    }

    last_exception = None
    for attempt in range(retries + 1):
        try:
            response = requests.put(update_url, json=payload, headers=headers)
            response.raise_for_status()
            return True  # Success
        except requests.exceptions.RequestException as e:
            last_exception = e
            if attempt < retries:
                time.sleep(delay)

    if last_exception:
        raise last_exception
    return False # Should not be reached

def calculate_and_update_estimations(session):
    """Calculate elected values for all issues and update Jira"""
    issues = JiraIssue.query.filter_by(session_id=session.session_id).all()
    votes = Vote.query.filter_by(session_id=session.session_id).all()

    # Group votes by issue
    votes_by_issue = {}
    for vote in votes:
        if vote.issue_key not in votes_by_issue:
            votes_by_issue[vote.issue_key] = []
        votes_by_issue[vote.issue_key].append(vote)

    update_results = []

    for issue in issues:
        issue_votes = votes_by_issue.get(issue.issue_key, [])

        if not issue_votes:
            # No votes for this issue
            update_results.append({
                'issue_key': issue.issue_key,
                'status': 'skipped',
                'reason': 'No votes'
            })
            continue

        # Calculate average (convert string estimations to numbers)
        try:
            numeric_votes = []
            for vote in issue_votes:
                try:
                    numeric_votes.append(float(vote.estimation))
                except (ValueError, TypeError):
                    # Skip non-numeric or invalid votes
                    continue

            if not numeric_votes:
                update_results.append({
                    'issue_key': issue.issue_key,
                    'status': 'skipped',
                    'reason': 'No valid numeric votes'
                })
                continue

            average = sum(numeric_votes) / len(numeric_votes)
            closest_fibonacci = find_closest_fibonacci(average)

            # Update Jira
            try:
                success = update_jira_custom_field(
                    session.jira_url,
                    session.jira_token,
                    issue.issue_key,
                    closest_fibonacci
                )

                update_results.append({
                    'issue_key': issue.issue_key,
                    'status': 'success' if success else 'failed',
                    'average': round(average, 2),
                    'elected_value': closest_fibonacci,
                    'votes_count': len(numeric_votes)
                })
            except Exception as e:
                update_results.append({
                    'issue_key': issue.issue_key,
                    'status': 'error',
                    'error': f"Jira update failed after retries: {str(e)}"
                })

        except Exception as e:
            update_results.append({
                'issue_key': issue.issue_key,
                'status': 'error',
                'error': str(e)
            })

    return update_results

@jira_bp.route('/create-session', methods=['POST'])
def create_session():
    try:
        data = request.get_json()
        jira_url = data.get('jira_url')
        jira_token = data.get('jira_token')
        jira_query = data.get('jira_query')
        creator_name = data.get('creator_name')

        if not all([jira_url, jira_token, jira_query, creator_name]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Test Jira connection
        try:
            issues = fetch_jira_issues(jira_url, jira_token, jira_query)
            if not issues:
                return jsonify({'error': 'No issues found or invalid Jira configuration'}), 400
        except Exception as e:
            return jsonify({'error': f'Failed to connect to Jira: {str(e)}'}), 400

        # Create session
        session_id = str(uuid.uuid4())
        session = VotingSession(
            session_id=session_id,
            jira_url=jira_url,
            jira_token=jira_token,
            jira_query=jira_query,
            creator_name=creator_name
        )

        db.session.add(session)

        # Store issues
        for issue in issues:
            jira_issue = JiraIssue(
                session_id=session_id,
                issue_key=issue['key'],
                issue_title=issue['fields']['summary'],
                issue_description=issue['fields'].get('description', ''),
                issue_url=f"{jira_url}/browse/{issue['key']}"
            )
            db.session.add(jira_issue)

        db.session.commit()

        return jsonify({
            'session_id': session_id,
            'message': 'Session created successfully',
            'issues_count': len(issues)
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/session/<session_id>', methods=['GET'])
def get_session(session_id):
    try:
        session = VotingSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        issues = JiraIssue.query.filter_by(session_id=session_id).all()
        votes = Vote.query.filter_by(session_id=session_id).all()

        # Group votes by issue
        votes_by_issue = {}
        for vote in votes:
            if vote.issue_key not in votes_by_issue:
                votes_by_issue[vote.issue_key] = []
            votes_by_issue[vote.issue_key].append(vote.to_dict())

        return jsonify({
            'session': session.to_dict(),
            'issues': [issue.to_dict() for issue in issues],
            'votes': votes_by_issue
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/vote', methods=['POST'])
def submit_vote():
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        issue_key = data.get('issue_key')
        voter_name = data.get('voter_name')
        estimation = data.get('estimation')

        if not all([session_id, issue_key, voter_name, estimation]):
            return jsonify({'error': 'Missing required fields'}), 400

        # Check if session exists and is not closed
        session = VotingSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.is_closed:
            return jsonify({'error': 'Voting session is closed'}), 400

        # Check if user already voted for this issue
        existing_vote = Vote.query.filter_by(
            session_id=session_id,
            issue_key=issue_key,
            voter_name=voter_name
        ).first()

        if existing_vote:
            # Update existing vote
            existing_vote.estimation = estimation
        else:
            # Create new vote
            vote = Vote(
                session_id=session_id,
                issue_key=issue_key,
                voter_name=voter_name,
                estimation=estimation
            )
            db.session.add(vote)

        db.session.commit()

        return jsonify({'message': 'Vote submitted successfully'}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

@jira_bp.route('/close-session', methods=['POST'])
def close_session():
    try:
        data = request.get_json()
        session_id = data.get('session_id')
        creator_name = data.get('creator_name')

        # Log close session request
        print(f"Close session request: {data}")

        if not all([session_id, creator_name]):
            return jsonify({'error': 'Missing required fields'}), 400

        session = VotingSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404

        if session.creator_name != creator_name:
            return jsonify({'error': 'Only the session creator can close the session'}), 403

        try:
            update_results = calculate_and_update_estimations(session)

            # Check for failures
            failed_updates = [r for r in update_results if r['status'] in ['failed', 'error']]
            if failed_updates:
                return jsonify({
                    'error': 'Failed to update one or more Jira issues. Session remains open.',
                    'details': failed_updates
                }), 500

            session.is_closed = True
            db.session.commit()

            return jsonify({
                'message': 'Session closed successfully',
                'jira_updates': update_results
            }), 200

        except Exception as jira_error:
            return jsonify({
                'error': 'An unexpected error occurred during Jira update. Session remains open.',
                'details': str(jira_error)
            }), 500

    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500

def fetch_jira_issues(jira_url, token, jql_query):
    """Fetch issues from Jira using JQL query"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Accept': 'application/json',
        'Content-Type': 'application/json'
    }

    # Clean up URL
    jira_url = jira_url.rstrip('/')

    # Construct search URL
    search_url = f"{jira_url}/rest/api/2/search"

    params = {
        'jql': jql_query,
        'maxResults': 50,
        'fields': 'summary,description,status,assignee,priority'
    }

    response = requests.get(search_url, headers=headers, params=params)
    response.raise_for_status()

    data = response.json()
    return data.get('issues', [])

