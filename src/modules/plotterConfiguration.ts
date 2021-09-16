import PlotterNames from '../constants/PlotterNames';

type PlotterConfigurationState = {
  available_plotters: string[]
};

const initialState: PlotterConfigurationState = {
  available_plotters: [PlotterNames.BLADEBIT, PlotterNames.CHIAPOS, PlotterNames.MADMAX],
}

export default function plotterConfigurationReducer(
  state: PlotterConfigurationState = { ...initialState },
  action: any,
): PlotterConfigurationState {
  switch (action.type) {
    case 'PLOTTER_CONFIGURATION':
      if (action.command === 'refresh_plotter_configurations') {

      }
    default:
      return state;
  }
}
