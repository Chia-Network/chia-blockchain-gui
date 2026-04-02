export type SingletonDependency = {
  launcherId: string;
  valuesToProve: string[];
};

export type SingletonSummaryRecord = {
  launcherId: string;
  newRoot: string;
  dependencies: SingletonDependency[];
};

type DataLayerOfferSummary = {
  offered: SingletonSummaryRecord[];
};

export default DataLayerOfferSummary;
