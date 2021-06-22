# Connecting the UI to a Remote Daemon

## On the daemon host

### Bind the daemon to 0.0.0.0

In order to be accessible from another machine, the daemon must be bound to 0.0.0.0 rather than localhost. To do this, edit `~/.chia/<currentvesion>/config/config.yaml` and change `self_hostname`:

````bash
self_hostname: 0.0.0.0
````

### Open the daemon's port

In order to be accessible from another machine, the dameon's port must be opened on its host. Using [ufw](https://help.ubuntu.com/community/UFW) and restricting traffic to just the UI's host:

````bash
sudo ufw allow from <IP of UI machine> to any port 55400 proto tcp
````

### Copy the daemon's cert files

To secure their connection, the UI will need the daemon's certificates. Copy these files to the UI machine:

````bash
~/.chia/<currentvesion>/config/ssl/daemon/private_daemon.crt
~/.chia/<currentvesion>/config/ssl/daemon/private_daemon.key
````

## On the UI host

Place the daemon's cert files, copied earlier, in the following location:

````bash
~/.chia/<currentvesion>/config/ssl/ui/
~/.chia/<currentvesion>/config/ssl/ui/
````

Find the `ui` section in `config.yaml` and specify the following settings:

````yaml
daemon_host: <name or IP of the daemon host>
daemon_port: 55400
daemon_ssl:
  private_crt: config/ssl/ui/private_daemon.crt
  private_key: config/ssl/ui/private_daemon.key
````

Note that these paths are `/daemon` by default, and they need to be `/ui` as the remote keys are distinct from the local ones.
