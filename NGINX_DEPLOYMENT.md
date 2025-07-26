# Deploying with a Local Nginx Reverse Proxy

This guide provides step-by-step instructions for deploying the Jira Estimation Tool with a local Nginx server acting as a reverse proxy.

This setup offers several benefits:
-   **Single Port of Entry**: Access the application on standard HTTP (80) or HTTPS (443) ports without needing to remember the application's specific port (e.g., 8080).
-   **Performance**: Nginx is highly efficient at handling concurrent connections and can offload tasks like serving static assets or terminating SSL.
-   **Security**: Nginx can act as a buffer between the internet and your application, providing opportunities to implement security measures like rate limiting or IP blocking.
-   **Scalability**: A reverse proxy makes it easier to scale your application across multiple servers in the future.

## Prerequisites

1.  **Docker and Docker Compose**: Ensure Docker and Docker Compose are installed and running, as per the `DEPLOYMENT_README.md`.
2.  **Nginx**: Nginx must be installed on your local machine.

    -   **On macOS (using Homebrew)**:
        ```bash
        brew install nginx
        ```
    -   **On Debian/Ubuntu**:
        ```bash
        sudo apt-get update
        sudo apt-get install nginx
        ```
    -   **On CentOS/RHEL**:
        ```bash
        sudo yum install epel-release
        sudo yum install nginx
        ```

## Deployment Steps

### Step 1: Run the Application with Docker

First, start the application using Docker Compose. This will build the container and run the application, making it available on port 8080.

```bash
# From the project root directory
docker-compose up --build -d
```

You can verify the application is running by visiting [http://localhost:8080](http://localhost:8080) in your browser.

### Step 2: Configure Nginx

Next, you need to create an Nginx configuration file to proxy requests to your application.

1.  **Create a new configuration file**:

    The location for Nginx configuration files varies by operating system:
    -   **macOS (Homebrew)**: `/usr/local/etc/nginx/servers/` or `/opt/homebrew/etc/nginx/servers/`
    -   **Linux**: `/etc/nginx/sites-available/`

    Create a new file named `jira-estimation.conf` in the appropriate directory. For example, on Linux:

    ```bash
    sudo nano /etc/nginx/sites-available/jira-estimation.conf
    ```

2.  **Add the following server block to the file**:

    This configuration tells Nginx to listen on port 80 and forward all incoming requests to the Jira Estimation application, which is running on `http://localhost:8080`.

    ```nginx
    server {
        listen 80;
        server_name localhost; # Or your domain name, e.g., jira.example.com

        location / {
            proxy_pass http://localhost:8080;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            # WebSocket support for real-time features
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
    ```

### Step 3: Enable the Nginx Configuration

On Linux, you need to create a symbolic link from `sites-available` to `sites-enabled` to activate the configuration. This step is not needed on macOS if you placed the file in the `servers` directory.

```bash
# Only for Linux systems
sudo ln -s /etc/nginx/sites-available/jira-estimation.conf /etc/nginx/sites-enabled/
```

### Step 4: Test and Reload Nginx

1.  **Test the Nginx configuration for syntax errors**:
    ```bash
    sudo nginx -t
    ```
    If the test is successful, you will see a confirmation message.

2.  **Reload Nginx to apply the new configuration**:
    ```bash
    # On macOS (Homebrew)
    brew services restart nginx

    # On Linux (systemd)
    sudo systemctl restart nginx
    ```

### Step 5: Access the Application

You can now access the Jira Estimation Tool through Nginx by navigating to [http://localhost](http://localhost) in your web browser. Nginx will handle the request and proxy it to the application running in the Docker container.

## Summary

By following these steps, you have successfully deployed the application behind a local Nginx reverse proxy. All traffic to `http://localhost` is now served by your application container, with Nginx managing the connection.

## Automating with Ansible

For users who prefer automation, an Ansible playbook is available to configure Nginx and deploy the application. This playbook automates the process of creating the configuration file, enabling the site, and reloading Nginx.

### Prerequisites

-   **Ansible**: Ensure Ansible is installed on your local machine.
    ```bash
    # Example using pip
    pip install ansible
    ```
- **Docker and Docker Compose**: Must be installed on the target machine.

### Playbook Overview

The `deploy_nginx.yml` playbook is designed to be idempotent and handles the full application lifecycle:

1.  **Application Deployment (`app` tag)**:
    -   Copies the project files to `/opt/jira-estimation`.
    -   Creates a systemd service (`jira-estimation.service`) to manage the application's Docker container.
    -   Starts and enables the service, ensuring the application runs on boot.

2.  **Nginx Configuration (`nginx` tag)**:
    -   Generates an Nginx site configuration from a template.
    -   Enables the site by creating the necessary symbolic link.
    -   Reloads the Nginx service to apply the configuration.

### Running the Playbook

1.  **Navigate to the Ansible directory**:
    ```bash
    cd ansible
    ```

2.  **Run the playbook**:

    -   To run the full deployment (app and Nginx) with the default `localhost` domain:
        ```bash
        ansible-playbook deploy_nginx.yml --ask-become-pass
        ```

    -   To deploy with a custom domain (e.g., `jira.example.com`):
        ```bash
        ansible-playbook deploy_nginx.yml --extra-vars "domain=jira.example.com" --ask-become-pass
        ```
    - To run only the application deployment tasks:
        ```bash
        ansible-playbook deploy_nginx.yml --tags "app" --ask-become-pass
        ```
    - To run only the Nginx configuration tasks:
        ```bash
        ansible-playbook deploy_nginx.yml --tags "nginx" --ask-become-pass
        ```


The `--ask-become-pass` flag will prompt you for your `sudo` password, which is required to modify system files and services.