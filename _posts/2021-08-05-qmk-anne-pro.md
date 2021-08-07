---
title: QMK on the Anne Pro from Windows
tags: [Anne Pro, QMK]
style: fill
color: dark
description: Flash a better firmware on your original Anne Pro
---

<span class="box yellow"><span>Attention:</span> The contents of this post apply to the original Anne Pro, not to the Anne Pro 2.</span>

[QMK] is a firmware for input devices:

> The goal of the QMK software project is to develop a completely customizable, powerful, and enjoyable firmware experience for any project - keyboard or otherwise - and to provide helpful, encouraging, and kind support and feedback for people with any software development experience.

## OK, but why?

### Layers
Imagine pressing a key and all your keys now do something else. You can dedicated media keys on one of those layers, or the Function keys from F13 - F24...

### Space cadet shift

> Essentially, when you tap Left Shift on its own, you get an opening parenthesis; tap Right Shift on its own and you get the closing one. When held, the Shift keys function as normal. Yes, it's as cool as it sounds, and now even cooler supporting Control and Alt as well!

Pretty cool, right?

### Shift, Alt and Ctrl tap

Hold shift / alt or ctrl for regular use, tap them for some othery keycode.

Eg: Tapping shift and releasing can type `<`. Or pause music. Or change to another layer, or cut/copy/paste....

<hr class="center-ball"/>

## QMK For the Anne Pro

There is a fork of the firmware with support for the original Anne Pro which you can find here: [msvisser/qmk_firmware][fork].

Thank you, [Michiel Visser][msvisser]! 

### Installing from Windows

#### 1) Install drivers

For interacting with the keyboard in DFU mode, which allows you to flash a new firmware, you first need the drivers.

Get the firmware update tools from the HexCore website:

https://service.hexcore.xyz/manual/annepro#41-update-firmware

Direct link to firmware update tool:

https://service.hexcore.xyz/tools/anne_fw_update_tools.rar


1. Unzip
2. Open "Driver" folder
3. Open Win8.1 folder
4. Open x64 folder
5. Install dpinst_amd64.exe
6. Reboot

#### 2) Download and compile QMK

I used WSL2, aka running linux inside windows for this part.

Inside your WSL2 distro with git installed, run:

```bash
sh util/linux_install.sh
git clone https://github.com/msvisser/qmk_firmware.git
git checkout anne_pro
make git-submodule
```


Compile the default keymap with

```bash
make anne_pro:default
```

Convert the .bin file to a .dfu file for use with dfu-util on windows:

```bash
./keyboards/anne_pro/dfuse-pack.py -b 0x08004000:anne_pro_default.bin anne_pro_default.dfu
```

#### 3) DFU Mode

Place your keyboard in DFU mode:

1. Connect your keyboard via USB
2. Hold the Escape key
3. Press the reset button on the back

#### 4) Flash firmware

Open DfuSeDemo.exe from the Anne pro FW update tool package you downloaded earlier.
It should detect your DFU mode keyboard.

Copy the `anne_pro_default.dfu` file from your WSL installation to somewhere the app can access it.

On the "Upgrade and verify" section of the app, click choose, pick your dfu file, then click upgrade.

This should erase the current firmware and load the new one. When complete (there's a progress bar), press the reset button on the back of the keyboard.

#### Done 🥳

You now have a working Anne Pro with QMK.
Customize your own keymap if you want. 
They're inside `keyboards/anne_pro/keymaps`.

What I've done is duplicated the `default` folder, renamed it `jcalado` and customized the keymap to add media controls and such.

You can compile this new keymap with

```bash
make anne_pro:jcalado

./keyboards/anne_pro/dfuse-pack.py -b 0x08004000:anne_pro_jcalado.bin anne_pro_jcalado.dfu
```


#### My keymap

My current keymap is also available on github (layer 3 is bluetooth configuration, layer 2 has RGB controls, page down / home / etc).

**Layer 0** - Tweaked Anne Pro Portuguese layout.  
- Mod tap for left shift: Types `<`. You can hold right shift and tap left shift to type `>`. I usually type with an ISO keyboard and do lots of coding. I wanted to keep this key next to the left shift, so mod-tap was an option.
- Mod tap for left shift: Hold for regular behavior, tap types `\`. Left shift + right shift tap types `|`. Another ISO layout adaptation.

**Layer 1** - Anne pro keycap printed functions
- Pagedown, Page up, RGB lighting controls, F1-F12, etc.

**Layer 2** - Media Controls
-  Media Play, Next, Previous
-  Volume Up, down, mute
-  F13 - F21
-  Board reset

**Layer 3** - Anne Pro Bluetooth configuration

- `ESC` - Exit Bluetooth layer
- `1, 2, 3, 4` - Connect to saved profile
- `Q, W, E, R` - Save connection to profile
- `A, S, D, F` - Delete saved connection
- `0` - Toggle legacy Bluetooth mode
- `-` - Disable Bluetooth
- `+` - Enable Bluetooth

I also had it change colors when switching layers to highlight special functions, and layers other than 0 had a bliking red number corresponding to active layer, but it seems the lighting goes out of sync easily. Board issue, I'm sure. 

{% include elements/button.html link="https://github.com/jcalado/anne-pro-qmk-keymap" text="Keymap" style="primary" size="sm" %}

<span class="box orange"><span>Attention:</span> Layer 2's media, volume and Fs only work when connected via USB.</span>

[qmk]: https://qmk.fm/
[fork]: https://github.com/msvisser/qmk_firmware/tree/anne_pro/keyboards/anne_pro
[msvisser]: https://github.com/msvisser
