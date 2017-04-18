const electron = window['require']('electron');
const {getCurrentWindow, TouchBar} = electron.remote;
const {TouchBarButton, TouchBarColorPicker, TouchBarGroup, TouchBarLabel, TouchBarPopover, TouchBarSlider, TouchBarSpacer, TouchBarScrubber, TouchBarSegmentedControl} = TouchBar;

const setTouchBar = function (args: any) {
  const win = getCurrentWindow();
  const touchBar = new TouchBar(args);
  win.setTouchBar(touchBar);
};

export {
  setTouchBar,
  TouchBarButton,
  TouchBarColorPicker,
  TouchBarGroup,
  TouchBarLabel,
  TouchBarPopover,
  TouchBarSlider,
  TouchBarSpacer,
  TouchBarSegmentedControl,
  TouchBarScrubber,
};
