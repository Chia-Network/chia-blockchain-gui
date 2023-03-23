import Client from '../Client';
import Daemon from '../services/Daemon';
import Farmer from '../services/Farmer';
import FullNode from '../services/FullNode';
import Harvester from '../services/Harvester';
import PlotterService from '../services/PlotterService';
import WalletService from '../services/WalletService';

export type ServiceClassWithoutClient =
  | typeof Daemon
  | typeof Farmer
  | typeof FullNode
  | typeof Harvester
  | typeof WalletService
  | typeof PlotterService;

type ServiceClass = ServiceClassWithoutClient | typeof Client;

export default ServiceClass;
