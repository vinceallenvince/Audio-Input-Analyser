Audio Input Analyser
======

Use the Audio Input Analyser to receive real-time audio analysis of your computer microphone's audio stream. The script uses both the getUserMedia and Web Audio APIs and is compatible in the latest version of Chrome.

You can find examples in the 'public' folder or at http://foldi.github.io/Audio-Input-Analyser/index.html

To get started, reference the AudioInputAnalyzer.min.js file in a &lt;script&gt; in the &lt;head&gt; of your document. Create and initialize a new AudioController. The AudioController uses pubsub to broadcast when data is ready. Subscribe to the 'meter' event and pass a callback to handle the data. 


```html
<!DOCTYPE html>
<html>
<head>
  <meta http-equiv='content-type' content='text/html; charset=UTF-8' />
  <title>Audio Input Analyser</title>
  <script src='scripts/AudioInputAnalyzer.min.js' type='text/javascript' charset='utf-8'></script>
  </head>
  <body>
    <script type='text/javascript' charset='utf-8'>

      var audioController = new AudioInputAnalyzer.AudioController();
      audioController.init();

      AudioInputAnalyzer.PubSub.subscribe('meter', function(data) {
        // work with data here
        document.body.innerHTML = 'channel1 avg volume: ' + data.averageVol1.toFixed() +
        		'<br /> channel2 avg volume: ' + data.averageVol2.toFixed();
      });

    </script>
  </body>
</html>

```

The following properties are attached to the data object passed to the callback.

* channelLevel1 - Channel 1 data average; use to detect clipping
* channelLevel2 - Channel 2 data average; use to detect clipping
* averageVol1 - Channel 1 average volume of all frequencies
* averageVol2 - Channel 2 average volume of all frequencies
* freqDomain1 - Channel 1 raw frequency domain
* freqDomain2 - Channel 2 raw frequency domain
* timeDomain1 - Channel 1 raw time domain
* timeDomain2 - Channel 2 raw time domain
* BAND10Array1 - Channel 1 10-band frequencies
* BAND10Array2 - Channel 2 10-band frequencies
* BAND31Array1 - Channel 1 31-band frequencies
* BAND31Array2 - Channel 2 31-band frequencies

BAND10 and BAND31 arrays include the following frequencies.

```html
/**
 * Typical frequencies in a 10-band spectrum.
 */
var BAND10 = [
  31, 63, 125, 250, 500,
  1000, 2000, 4000, 8000, 16000
];

/**
 * Typical frequencies in a 31-band spectrum.
 */
var BAND31 = [
  20, 25, 31, 40, 50, 63, 80, 100, 126, 160,
  201, 253, 320, 403, 507, 640, 806, 1000, 1300, 1600,
  2000, 2500, 3200, 4000, 5100, 6400, 8100, 10000, 13000, 16000,
  20000
];
```

Building this project
======

This project uses <a href='http://gruntjs.com'>Grunt</a>. To build the project first install the node modules.

```
npm install
```

Next, run grunt.

```
grunt
```

A pre-commit hook is defined in /pre-commit that runs jshint. To use the hook, run the following:

```
ln -s ../../pre-commit .git/hooks/pre-commit
```

A post-commit hook is defined in /post-commit that runs the Plato complexity analysis tools. To use the hook, run the following:

```
ln -s ../../post-commit .git/hooks/post-commit
```