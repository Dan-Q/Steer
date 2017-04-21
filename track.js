'use strict';

(function(){
  const track = document.getElementById('track');
  const ctx = track.getContext('2d');
  const car = new Image(); car.src = 'car.png';
  const degToRad = Math.PI / 180; 
  const speedMultiplier = 0.01;
  const segmentLength = 10;
  const topSpeedRoad = 120;
  const topSpeedGrass = 15;
  const topAccel = 0.5;
  const accelRate = 0.008;
  const minWidth = 100;
  const aggressionBase = 50;
  const aggressionMultiplier = 0.005;
  const segmentCapAgression = 10000; // last road segment for which agression increases

  track.width = window.innerWidth;
  track.height = window.innerHeight;
  let lastFrame = Date.now();
  let beta = 0;
  let speed = 1;
  let carX = (track.width - car.width) / 2;
  let carY = 0;

  db.ref('beta').on('value', function(ref){
    beta = ref.val();
  });

  function drawRotatedImage(image, angleInRad, positionX, positionY, axisX, axisY) {
    ctx.translate(positionX, positionY);
    ctx.rotate(angleInRad);
    ctx.drawImage(image, -axisX, -axisY);
    ctx.rotate(-angleInRad);
    ctx.translate(-positionX, -positionY);
  }

  function roadAt(segment){
    let segmentOrCapAggression = segment;
    if(segmentOrCapAggression > segmentCapAgression) segmentOrCapAggression = segmentCapAgression;
    let widthMultiplier = 0.25 - ((segment / 500) * 0.01);
    let width = track.width * widthMultiplier;
    if(width < minWidth) width = minWidth;
    let aggression = aggressionBase + (segmentOrCapAggression * aggressionMultiplier);
    let segToRad = segment * degToRad;
    let sin = Math.sin(segToRad);
    let cos = Math.cos(segToRad * 0.75);
    let sin2 = Math.cos(segToRad * 0.3);
    let x = (((track.width - width) / 2) + (sin + cos + sin2) * aggression);

    //x = ((segment % 2 == 0) ? 400 : 410);
    //width = ((((segment % 100) == 0) || (((segment - 1) % 100) == 0)) ? 600 : 100)

    return { x: x, width: width };
  }

  function roadFrom(startSegment, endSegment) {
    let road = [];
    for(let i = startSegment; i <= endSegment; i++){
      road.push(roadAt(i));
    }
    return road;
  }
 
  function render(){
    // Manage time-passed since last frame
    let now = Date.now();
    let timePassed = now - lastFrame;
    lastFrame = now;
    // Determine whether car on road or grass and set top speed accordingly
    let carSegmentNumber = Math.floor((carY + (car.height * 2.8)) / segmentLength);
    let carCurrentRoad = roadAt(carSegmentNumber);
    let onRoad = ((carX > carCurrentRoad.x) && (carX < (carCurrentRoad.x + carCurrentRoad.width)))
    let topSpeed = (onRoad ? topSpeedRoad : topSpeedGrass);
    // Accelerate car if possible
    if(speed < topSpeed){
      let diff = topSpeed - speed;
      let modDiff = diff * accelRate;
      speed = speed + (modDiff > topAccel ? topAccel : modDiff);
    }
    // Decelerate if over top speed
    if(speed > topSpeed){
      let diff = speed - topSpeed;
      speed -= ((diff > 1) ? 1 : diff);
    }
    // Move car etc.
    let distanceTravelled = timePassed * speed * speedMultiplier;
    let distanceX = Math.sin(beta * degToRad) * distanceTravelled;
    let distanceY = distanceTravelled - Math.abs(distanceX);
    carX = carX + distanceX;
    carY = carY + distanceY;
    // Render this frame
    ctx.clearRect(0, 0, track.width, track.height);
    // Shift the canvas
    // ctx.translate(0,1)
    // Draw road
    /*let bottomOfScreenRoadPoint = carY - (car.height * 2);
    for(let i = 0; i < track.height; i++){
      let y = track.height - 1 - i;
      let road = getRoad(bottomOfScreenRoadPoint + i);
      ctx.moveTo(road.x, y);
      ctx.lineTo(road.x + road.width, y);
      ctx.stroke();
    }*/
    // Determine where we are in our current segment, and which segment that is
    let positionInSegment = carY % segmentLength;
    let segmentNumber = (carY - positionInSegment) / segmentLength;
    // Write some debug output
    ctx.font = "18px Arial";
    ctx.fillText(`Segment: ${segmentNumber}`, 10, 30);
    ctx.fillText(`Carsegment: ${carSegmentNumber}`, 10, 60);
    ctx.fillText(`carCurrentRoad: ${Math.floor(carCurrentRoad.x)} ${Math.ceil(carCurrentRoad.width + carCurrentRoad.x)}`, 10, 90);
    ctx.fillText(`carX: ${Math.round(carX)}`, 10, 120);
    ctx.fillText(`Speed: ${Math.round(speed)}`, 10, 150);
    ctx.fillText(`Surface: ${(onRoad ? 'Road' : 'Grass')}`, 10, 180);
    // Determine and draw road
    let numSegmentsVisible = Math.ceil(track.height / segmentLength) + 1;
    let road = roadFrom(segmentNumber, segmentNumber + numSegmentsVisible);
    let bottomOfRoad = track.height + positionInSegment;
    ctx.beginPath();
    ctx.moveTo(road[0].x + road[0].width, bottomOfRoad);
    for(let i = 0; i < road.length; i++){
      ctx.lineTo(road[i].x, bottomOfRoad - (i * segmentLength))
    }
    for(let i = road.length - 1; i >= 0; i--){
      ctx.lineTo(road[i].x + road[i].width, bottomOfRoad - (i * segmentLength))
    }
    ctx.closePath();
    ctx.fill();
    // Draw road markings
    ctx.beginPath();
    let prevX;
    ctx.moveTo(road[0].x + (road[0].width / 2), bottomOfRoad);
    for(let i = 0; i < road.length; i++){
      let currentSegmentNumber = segmentNumber + i;
      if((currentSegmentNumber >= 4000) && (currentSegmentNumber <= 4010)) {
        // no lines
      } else if(currentSegmentNumber < 4000) {
        // three lanes
        if((currentSegmentNumber % 10) < 4) {
          ctx.lineTo(road[i].x + (road[0].width / 3), bottomOfRoad - (i * segmentLength));
          ctx.moveTo(prevX + (road[0].width / 3 * 2), bottomOfRoad - ((i - 1) * segmentLength));
          ctx.lineTo(road[i].x + (road[0].width / 3 * 2), bottomOfRoad - (i * segmentLength));
          ctx.moveTo(road[i].x + (road[0].width / 3), bottomOfRoad - (i * segmentLength));
        } else {
          ctx.moveTo(road[i].x + (road[0].width / 3), bottomOfRoad - (i * segmentLength));
        }
        prevX = road[i].x;
      } else {
        // two lanes
        if((currentSegmentNumber % 10) < 4){
          ctx.lineTo(road[i].x + (road[0].width / 2), bottomOfRoad - (i * segmentLength));
        } else {
          ctx.moveTo(road[i].x + (road[0].width / 2), bottomOfRoad - (i * segmentLength));
        }
      }
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.stroke();
    // Debugline
    /*ctx.beginPath();
    ctx.moveTo(carX, 0);
    ctx.lineTo(carX, track.height);
    ctx.closePath();
    ctx.strokeStyle = '#ff0000';
    ctx.stroke();*/
    // Draw car at appropriate position and angle
    drawRotatedImage(car, (beta * degToRad), carX, (track.height - (car.height * 2)), (car.width / 2), (car.height / 2));
  }

  (function animLoop(){
    render();
    window.requestAnimationFrame(animLoop, track);
  })();
})();
