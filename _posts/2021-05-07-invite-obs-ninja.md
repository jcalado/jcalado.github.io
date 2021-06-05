---
title: invite.vdo.ninja
tags: [VDO.Ninja, development]
style: fill
color: primary
description: This site helps you generate custom VDO.ninja links
---

{% include elements/figure.html image="/blogassets/1/invite.vdo.ninja.png" caption="Ninja invite page UI" %}


### What is [VDO.ninja][ninja]?

> Bring live video from your smartphone, remote computer, or friends directly into OBS or other studio software.

[VDO.ninja][ninja] uses [WebRTC][webrtc] to send and receive video and audio streams over the public internet, while keeping the latency as low as possible. There are no servers involved in bouncing the video around, apart from very specific cases.

### What is invite.vdo.ninja?

[Invite.vdo.ninja][invite ninja] is a way to generate custom invite urls for, well, vdo.ninja.  
If you are only starting your ninja journey, it can help you extract more from it without needing to dive too deep onto the documentation.

### Example use case

Want to generate a ninja invite with:

- Auto-selected & auto-started webcam
- Use a password
- Label the user, so you can use it later
- Custom predefined link for your mixer software

Say no more.

___

### Make it so

1. Visit [invite.vdo.ninja][invite ninja]
2. Set a custom push ID inside the **Invite** panel, under **Custom Push ID**. In this case I chose `thisISmycustomLink`. Pick a password and set it up as well. I chose `passwordisSafe`.
3. Select **webcam** under the **Sharing types** panel.
4. Select the **Auto-Start** option under **Guest Features**. Type a display name while you’re at it – it’s the **Set display name** option. I chose `Joel`. Make sure you click out of the field for the generated URL to update. 
5. The generated link is at the bottom of the page. You can click the “Obfuscate” button near the link to make it a really long and really complicated URL. This will prevent my friend from messing with any of the options I set. 
6. You can copy the link to send to your guest by just clicking on it. 

Then pull in your guest's / friend webcam inside your OBS with the link `https://vdo.ninja/?view=CUSTOM_ID&password=PASSWORD`.

Replace *CUSTOM_ID* with your push id, in my case: `thisISmycustomLink`.  
Replace *PASSWORD* with your password, in my case: `passwordisSafe`.

You can just drag and drop this url on the **Scenes** panel of OBS and it will take care of everything for you. You can also manually set it up by adding a new browser source and pasting in the link.  

In any case, **make sure that browser source has “Control audio via OBS” active**.

### Video tutorial

{% include elements/video.html id="5dU28ycxo4E" %}


There's a whole lot more that can be done with [invite.vdo.ninja][invite ninja].

Explore the site, learn ninja, be the ninja!

[ninja]: https://vdo.ninja
[webrtc]: https://webrtc.org
[invite ninja]: https://invite.vdo.ninja
