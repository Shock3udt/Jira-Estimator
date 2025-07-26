import uuid
import requests
from flask import Blueprint, request, jsonify
from src.models.user import db
from src.models.voting_session import VotingSession, JiraIssue, Vote

jira_bp = Blueprint('jira', __name__)

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
        
        if not all([session_id, creator_name]):
            return jsonify({'error': 'Missing required fields'}), 400
        
        session = VotingSession.query.filter_by(session_id=session_id).first()
        if not session:
            return jsonify({'error': 'Session not found'}), 404
        
        if session.creator_name != creator_name:
            return jsonify({'error': 'Only the session creator can close the session'}), 403
        
        session.is_closed = True
        db.session.commit()
        
        return jsonify({'message': 'Session closed successfully'}), 200
        
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

