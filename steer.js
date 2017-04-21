'use strict';

(function(){
  const refreshRate = Math.floor(1000 / 60);
  const tilt = document.getElementById('tilt');
  let beta = 0;
  let betaChanged = false;

  function handleOrientation(event){
    let currentBeta = Math.floor(event.beta * 10) / 10;
    if(beta == currentBeta) return;
    beta = currentBeta;
    betaChanged = true;
    tilt.innerHTML = beta;
  }

  function pushChanges(){
    if(!betaChanged) return;
    betaChanged = false;
    db.ref('beta').set(beta);    
    console.log(`pushed ${beta}`);
  }

  window.addEventListener('deviceorientation', handleOrientation, true);
  setInterval(pushChanges, refreshRate)
})();
