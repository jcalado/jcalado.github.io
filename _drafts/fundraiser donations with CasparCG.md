---
layout: post
title:  "Live fundraiser donations with casparCG"
---

# ADRA

ADRA is an NGO with planet-wide operations. ADRA: Adventist Development and Relief Agency operates in over 118 countries.  

[ADRA Portugal](https://adra.org.pt/) had a fundraiser concert livestreamed and performed before a live audience on December 19th 2021.

# Past concerts

In the past volunteers would process donations manually, with money being transferred via Paypal, wire transfer, or MB Way, a simple smartphone operated way to pay for stuff or transfer funds.

Since private phone numbers are limited in how much money they can have transferred to each month, they would swap out phone numbers mid show if needed.  
This was cumbersome and introduced issues with people trying to donate to already tapped out numbers.
Volunteers would also have to manually check in each donation and update a txt file what would have its text displayed on screen.

# The challenge

We wanted to
- Show in near real time the amount of money being donated through on screen graphics.
- Have no MB Way phone numbers involved.
- Be able to add custom amounts besides the automated way.

This is the story of how I helped pulled that off.
  
## Game plan

- Payment processing through [ifthenpay](https://ifthenpay.com/)
- Online form for placing donations
- Custom app to manage donations and feed data to Caspar CG
- Custom graphics for Caspar CG

# Part 1: Donations

ADRA filled for an account with [ifthenpay](https://ifthenpay.com/). A couple days later we had access to the API.
I prototyped a website and reused an already existing ADRA domain name to place it: [https://www.apoieadra.pt/](https://www.apoieadra.pt/)

This posts the data through to ifthenpay while providing some sort of feedback.

# Part 2: Donation management

I developed a couple of pages to be the donation management app and donations overlay on caspar CG.
They connected through websockets, so technicaly you could have the person responsible for handling the donations anywhere!

The websockets server was also the API server for the ifthenpay donations callback.

Whenever money was donated, I got a websocket packet with details on the amount donated.
This was then added to a "buffer" value on the admin app. The admin app could then push data to the caspar cg template.

I set up a reverse proxy on my home connection and had the ifthenpay callback be posted to it.

