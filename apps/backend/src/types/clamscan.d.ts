declare module "clamscan" {
  export default class NodeClam {
    init(options: any): Promise<NodeClam>;
    scanStream(stream: any): Promise<any>;
  }
}
