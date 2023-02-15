import type Block from '../@types/Block';
import type BlockHeader from '../@types/BlockHeader';
import type BlockRecord from '../@types/BlockRecord';
import type BlockchainState from '../@types/BlockchainState';
import type Connection from '../@types/Connection';
import type FeeEstimate from '../@types/FeeEstimate';
import Client from '../Client';
import type Message from '../Message';
import ServiceName from '../constants/ServiceName';
import Service from './Service';
import type { Options } from './Service';

export default class FullNode extends Service {
  constructor(client: Client, options?: Options) {
    super(ServiceName.FULL_NODE, client, options);
  }

  async getBlockRecords(start: number, end: number) {
    return this.command<{ blockRecords: BlockRecord[] }>('get_block_records', {
      start,
      end,
    });
  }

  async getUnfinishedBlockHeaders() {
    return this.command<{ headers: BlockHeader[] }>('get_unfinished_block_headers');
  }

  async getBlockchainState() {
    return this.command<{ blockchainState: BlockchainState }>('get_blockchain_state');
  }

  async getConnections() {
    return this.command<{ connections: Connection[] }>('get_connections');
  }

  async openConnection(host: string, port: number) {
    return this.command<void>('open_connection', {
      host,
      port,
    });
  }

  async closeConnection(nodeId: string) {
    return this.command<void>('close_connection', {
      nodeId,
    });
  }

  async getBlock(headerHash: string) {
    return this.command<{ block: Block }>('get_block', {
      headerHash,
    });
  }

  async getBlockRecord(args: { headerHash: string }) {
    return this.command<{ blockRecord: BlockRecord }>('get_block_record', args);
  }

  async getFeeEstimate(targetTimes: number[], spendType: string) {
    return this.command<FeeEstimate>('get_fee_estimate', {
      targetTimes,
      spendType,
    });
  }

  onBlockchainState(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('get_blockchain_state', callback, processData);
  }

  onConnections(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onCommand('get_connections', callback, processData);
  }

  onNewBlock(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('new_block', callback, processData);
  }

  onNewPeak(callback: (data: any, message: Message) => void, processData?: (data: any) => any) {
    return this.onStateChanged('new_peak', callback, processData);
  }
}
