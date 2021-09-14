type PlotterConfiguration = {
  plotter_display_name: string;
  plotter_version: string;
};

type PlotterConfigurationState = {
  available_plotters: PlotterConfiguration[]
};

const initialState: PlotterConfigurationState = {
  available_plotters: [
    {
      plotter_display_name: "Chia Proof of Space",
      plotter_version: "1.0.4",
    },
    {
      plotter_display_name: "madMAx Chia Plotter",
      plotter_version: "0.1.5",
    },
    {
      plotter_display_name: "BladeBit Chia Plotter",
      plotter_version: "1.1.0",
    },
  ]
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
