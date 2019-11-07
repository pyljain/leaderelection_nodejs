# leaderelection_nodejs

Build the Kubernetes Leader Election logic using some helper libraries.
Currently, this code checks for which Pod is the current leader and updates
a timestamp to indicate the last heartbeat. Each pod polls the API server to
check if a leader is currently elected and if the leader's last heartbeat is
within the defined timeframe.

If not, the Pod tries to acquire leadership by updating the deployment
annotation with its name and a timestamp of when it requested to claim
leadership.
