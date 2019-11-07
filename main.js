const { KubeConfig } = require('kubernetes-client')
const Client = require('kubernetes-client').Client
const RequestKubernetes = require('kubernetes-client/backends/request')

let backend

if (process.env.KUBECONFIG) {
  const kubeconfig = new KubeConfig()
  kubeconfig.loadFromFile(process.env.KUBECONFIG)
  backend = new RequestKubernetes({ kubeconfig })
} else {
  backend = new RequestKubernetes(RequestKubernetes.config.getInCluster())
}

const client = new Client({ backend, version: '1.13' })

const run = async () => {
  console.log('Service ready for pod', process.env.MY_POD_NAME)
  while(1) {
    await heartbeat()
    await wait(1)

  }

  console.log("HEARTBEAT CALLED")
}

const heartbeat = async () => {
  try {
    const deployment = await client.apis.apps.v1.namespaces(process.env.MY_POD_NAMESPACE).deployments('controller-node').get()
    console.log('Deployment details: ', deployment.body)
    let leader = deployment.body.metadata.annotations.currentLeader
    let lastUpdatedTimestamp = deployment.body.metadata.annotations.lastUpdatedTimestamp
    let timeDiff = (Date.now() - Number(lastUpdatedTimestamp))/60000
    if (leader == null || leader == '' || timeDiff > 3) {

      const updatedAnnotations = {
        ...deployment.body.metadata.annotations,
        currentLeader: process.env.MY_POD_NAME,
        lastUpdatedTimestamp: Date.now().toString()
      }

      const updateLeader = {
        metadata:{
          annotations: updatedAnnotations
        }
      }

      const updatedLeader = await client.apis.apps.v1.namespaces(process.env.MY_POD_NAMESPACE).deployments('controller-node').patch({ body: updateLeader })
      console.log("updatedLeader", updatedLeader)

    } else if (deployment.body.metadata.annotations.currentLeader == process.env.MY_POD_NAME) {
      const updatedAnnotations = {
        ...deployment.body.metadata.annotations,
        lastUpdatedTimestamp: Date.now().toString()
      }

      const heartbeatTimestamp = {
        metadata: {
          annotations: updatedAnnotations
        }
      }
      const heartbeatUpdated = await client.apis.apps.v1.namespaces(process.env.MY_POD_NAMESPACE).deployments('controller-node').patch({ body: heartbeatTimestamp })
      console.log("heartbeatUpdated", heartbeatUpdated)
    }
  } catch(e) {
    console.error(e)
  }
}

const wait = (sec) => new Promise((resolve, reject) => {
  setTimeout(() => {
    resolve()
  }, 1000 * sec)
})

run()

