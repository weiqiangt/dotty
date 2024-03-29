import {RawConfig, RawDevice} from "./raw.config";
import {SimulationLinkDatum, SimulationNodeDatum} from "d3-force";

export class Config {
  nodes: NodeType[] = [];
  links?: LinkType[] = [];
}

export class NodeType implements SimulationNodeDatum {
  index?: number;
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;

  id: string | number;
  label: string;
  group: string;
  type: string;
  children?: Config;
  attrs?: {};
}

export class LinkType implements SimulationLinkDatum<NodeType> {
  source: any;
  target: any;
  label: string;
  attrs?: {};
}


function nodeFinder(rawDevice: RawDevice, config: Config, memo: Map<string, Config>, pre: string = null): void {
  let id = pre === null ? rawDevice.id : `${pre}.${rawDevice.id}`;
  let node: NodeType = {
    id: id,
    type: rawDevice.type,
    label: rawDevice.name,
    group: '#91a7ff',
    attrs: rawDevice.attrs ? rawDevice.attrs : {}
  };
  if (rawDevice.subs != null && rawDevice.subs.length !== 0) {
    node.children = new Config();
    for (let sub of rawDevice.subs) {
      nodeFinder(sub, node.children, memo, id);
    }
  }
  memo.set(id, config);
  config.nodes.push(node);
}

function concat(pre, cur): string {
  return pre === '' ? cur : pre + '.' + cur;
}

function get_source_from_memo(source, memo: Map<string, Config>) {
  let item = '';
  memo.forEach((value, key) => {
    let s = key.split('.');
    if (s[s.length - 1] === source) {
      item = key
    }
  });

  return item
}

export function translate(raw: RawConfig): NodeType {
  let config = new Config();
  let memo: Map<string, Config> = new Map<string, Config>();
  memo.set('', config);

  for (let rawDevice of raw.devices) nodeFinder(rawDevice, config, memo);

  console.log(memo);
  for (let connection of raw.connections) {
    // console.log(connection)
    let loc_connect_from = get_source_from_memo(connection.from, memo);
    let loc_connect_to = get_source_from_memo(connection.to, memo);
    let fromSegs = loc_connect_from.split('.');
    let toSegs = loc_connect_to.split('.');
    let path = '';
    for (let i = 0; i < fromSegs.length && i < toSegs.length; i++) {
      if (fromSegs[i] === toSegs[i]) {
        path = concat(path, fromSegs[i]);
      } else {
        let source = concat(path, fromSegs[i]);
        let target = concat(path, toSegs[i]);
        if (!memo.get(source).links) memo.get(source).links = [];
        memo.get(source).links.push({
          source: source,
          target: target,
          label: connection.link_type,
          attrs: connection.attrs ? connection.attrs : {}
        });
        break;
      }
    }
  }
  let top = {
    id: 'TOP',
    label: 'TOP',
    children: config,
    type: 'NULL',
    group: '#fff'
  };
  console.debug(top);
  return top;
}

