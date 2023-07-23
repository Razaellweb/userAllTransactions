import { providers } from "ethers";
import { EVMNodeInquirer } from "./nodeInquirer";
import { Interface } from "ethers/lib/utils";
import { ABI } from "../../types";

export class EVMContract {
  address: string;
  abi: ABI;
  deployedBlock: number;

  constructor(address: string, abi: ABI, deployedBlock = 0) {
    this.abi = abi;
    this.address = address;
    this.deployedBlock = deployedBlock;
  }

  call<T>(
    nodeInquirer: EVMNodeInquirer,
    methodName: string,
    methodParams: any[] = [],
    blockTag?: providers.BlockTag
  ) {
    return nodeInquirer.callContract<T>(
      this.address,
      this.abi,
      methodName,
      methodParams,
      blockTag
    );
  }

  getLogsSinceDeployment(
    nodeInquirer: EVMNodeInquirer,
    eventName: string,
    topics: string[],
    toBlock: providers.BlockTag = "latest"
  ) {
    return nodeInquirer.getLogs(
      eventName,
      topics,
      this.abi,
      this.address,
      this.deployedBlock,
      toBlock
    );
  }

  getLogs(
    nodeInquirer: EVMNodeInquirer,
    eventName: string,
    topics: string[],
    fromBlock: number,
    toBlock: providers.BlockTag = "latest"
  ) {
    return nodeInquirer.getLogs(
      eventName,
      topics,
      this.abi,
      this.address,
      fromBlock,
      toBlock
    );
  }

  encodeFunctionData(methodName: string, methodParams?: any[]) {
    const contractIface = new Interface(this.abi);
    return contractIface.encodeFunctionData(methodName, methodParams);
  }
  decodeFunctionResult(methodName: string, methodResult: string) {
    const contractIface = new Interface(this.abi);
    return contractIface.decodeFunctionResult(methodName, methodResult);
  }
  decodeLogs(eventData: string, eventTopics: string[]) {
    const contractIface = new Interface(this.abi);
    return contractIface.parseLog({ data: eventData, topics: eventTopics });
  }
}
