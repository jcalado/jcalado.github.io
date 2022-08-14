---
title: Paralell Youtube-DL downloads with powershell on windows
tags: [Powershell, Scripting]
categories:
    - scripts
date: 2021-10-08
description: Be done with it quicker!
---

Youtube-dl playlist downloads are done sequentially. However you can speed things up by running multiple youtube-dl processes in paralell.

## Requirements

This will only work with PowerShell 7, not PowerShell 5.* which comes bundled with windows 10/11.

**Check your Powershell version** with 
```powershell
Get-Host | Select-Object Version 
``` 

If you are running the preinstalled windows powershell 5, update it: [instructions here](https://docs.microsoft.com/en-us/powershell/scripting/whats-new/migrating-from-windows-powershell-51-to-powershell-7?view=powershell-7.1).

### Quick tip: Updating to powershell 7 with winget
If you have `winget` already installed, just run
```
winget install --name PowerShell --exact --source winget
```

## Downloading 5 videos simultaneously from a youtube playlist 
Launch powershell 7 and execute

```powershell
 youtube-dl --get-id "YOUR_YOUTUBE_PLAYLIST_URL" | ForEach-Object -Parallel { youtube-dl.exe -f best "$_"; } -ThrottleLimit 5
```

This will run 5 youtube-dl.exe processes simultaneously instead of each video only downloading after the previous is finished.