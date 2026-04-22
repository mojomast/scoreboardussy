import React from 'react';
import { useDesign } from '../../contexts/DesignContext';
import DarkControlPanel from './variants/DarkControlPanel';
import TouchControlPanel from './variants/TouchControlPanel';
import GamepadControlPanel from './variants/GamepadControlPanel';

const ControlPanelRouter: React.FC<any> = (props) => {
  const { designs } = useDesign();

  switch (designs.controlPanel) {
    case 'dark':
      return <DarkControlPanel {...props} />;
    case 'touch':
      return <TouchControlPanel {...props} />;
    case 'gamepad':
      return <GamepadControlPanel {...props} />;
    default:
      return <DarkControlPanel {...props} />;
  }
};

export default ControlPanelRouter;
