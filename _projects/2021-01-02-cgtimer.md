---
name: CGTimer
tools: [Javascript, electron]
image: https://github.com/jcalado/cgtimer/raw/master/screenshots/Standby.png
description: Control multiple hyperdeck recorders from a single UI.
---

# CGTimer

CGTimer is an electron app to display current video time from a CasparCG server instance.  

# Features

 - Displays active clip current time
 - Displays remaining clip time
 - Starts flashing red at less than 5 seconds to clip end
 - Warns about video being looped, via a red "L" on the clip time panel
 - When CasparCG is issued a STOP command to the ffmpeg producer, everything is reset

![preview](https://github.com/jcalado/cgtimer/raw/master/screenshots/Standby.png)

<p class="text-center">
{% include elements/button.html link="https://github.com/jcalado/cgtimer" text="Learn More" %}
</p>
