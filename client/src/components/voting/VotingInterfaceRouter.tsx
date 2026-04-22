import React from 'react';
import { useDesign } from '../../contexts/DesignContext';
import SocialVoting from './variants/SocialVoting';
import CasinoVoting from './variants/CasinoVoting';
import MinimalVoting from './variants/MinimalVoting';

const VotingInterfaceRouter: React.FC<any> = (props) => {
  const { designs } = useDesign();

  switch (designs.voting) {
    case 'social':
      return <SocialVoting {...props} />;
    case 'casino':
      return <CasinoVoting {...props} />;
    case 'minimal':
      return <MinimalVoting {...props} />;
    default:
      return <SocialVoting {...props} />;
  }
};

export default VotingInterfaceRouter;
