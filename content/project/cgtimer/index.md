---
title: CGTimer
date: 2021-01-02
categories:
    - apps
tags: [javascript, electron]
image: https://github.com/jcalado/cgtimer/raw/master/screenshots/Standby.png
description: Get current timecode from a casparCG server.
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

https://github.com/jcalado/cgtimer