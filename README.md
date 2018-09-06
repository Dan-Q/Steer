# Steer!

Experimental JS canvas game using a Websocket connection to a mobile phone as a controller.

![GIF of demo video](https://github.com/Dan-Q/Steer/blob/master/steer-demo.gif?raw=true)

## Configuration

You will need a [Firebase](https://firebase.google.com/) account and an app set up to connect this too. Copy
firebase.js.example to firebase.js and fill it with your own app credentials/details.

## Playing

Point your desktop browser at track.html. Point your mobile browser at index.html. Use your mobile phone to
steer the car. Try to get as far as you can, as fast as you can: the further you go, the narrower the road
gets and the more-aggressive the corners become.

## Caveats/Warnings

There's a lot of hacky code here. It's not been tested on anything other than a handful of screen sizes and
only on one mobile browser. ES6 variable/constant definitions are used.

## Further reading

Blog post: https://danq.me/2017/04/28/steer/
