---
name: Semáforo de Vacinação COVID
tools: [Javascript, react-native]
image: https://i.postimg.cc/FKpftPKv/App.png
description: How long do I have to wait in line for my covid jab?
---

# Semáforo de Vacinação COVID - Mobile app

This react-native app will consume the same data as https://covid19.min-saude.pt/cvc and present it in a friendly manner.
It is my first react-native app, so some things might not be 100% up to standard.


# Features

- Downloads realtime data from the API endpoint
- Searches by location or center name
- Shows a map with API provided markers so you can have a sense of scale. There are a lot of centers!
- Displays how old the API provided data is, so the user is not mislead.
- Provides undocumented stats such as "Pessoas em recobro", "Pessoas em espera"
- Pull down to refresh data

<p class="text-center">
{% include elements/button.html link="https://github.com/jcalado/semaforodevacinacao" text="Show me the code" %}
</p>

# Screenshots
![Main page](https://i.postimg.cc/kMxCY2YN/Screenshot-1625991749.png)
![Details page](https://i.postimg.cc/Dy6TFtT8/Screenshot-1625991778.png)
![More details](https://i.postimg.cc/pXRHwP3w/Screenshot-1625991789.png)
![Map](https://i.postimg.cc/MprJfVXw/Screenshot-1625991824.png)
![Searching centers](https://i.postimg.cc/sg2R2wjK/Screenshot-1625991858.png)
