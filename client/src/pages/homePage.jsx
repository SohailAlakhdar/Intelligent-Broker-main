import React from 'react'
import Main from '../components/main.jsx';
import Info from '../components/infoSection/info.jsx';
import { homeObjOne, homeObjTwo, homeObjThree } from '../components/infoSection/data.jsx';
import Services from '../components/services.jsx';
import PredictionForm from '../components/predictionForm.jsx';
function Home(props) {
    return (
        <div>
            <Main />
            <Info {...homeObjOne} />
            <Info {...homeObjTwo} />
            <Services dark={true} ID="services" from="Services" />
            <PredictionForm />
            {!props.auth &&
              <Info {...homeObjThree} />
            }
        </div>
    )
}

export default Home;
