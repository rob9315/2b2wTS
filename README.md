# This is in beta and is still being developed, all things described in this readme may not be final!

<!-- Logo And Title -->

<p align="center">
  <a href="https://github.com/rob9315/2b2wTSr" title="2Bored2Wait TS">
    <img src="logo.png" width="80px" alt="2Bored2Wait TS"/>
  </a>
</p>
<h1 align="center">2Bored2Wait TyperScript</h1>
<p align="center">A proxy to wait out 2b2t.org's way too long queue. All made in TyperScript!</p>

<!-- Badges -->

<p align="center">
  <a href="https://github.com/rob9315/2b2wTS/releases"><img alt="2b2wTS Version" src="https://img.shields.io/github/package-json/v/Rob9315/2b2wts?style=for-the-badge"/></a>
  <a href="https://github.com/rob9315/2b2wTS/issues"><img alt="Issues Counter" src="https://img.shields.io/github/issues/rob9315/2b2wts?style=for-the-badge"/></a>
  <a href="https://discord.gg/9ZrXZp7nVj"><img alt="Discord Server" src="https://img.shields.io/badge/dynamic/json?label=Discord&color=7289da&query=%24.presence_count&url=https%3A%2F%2Fdiscordapp.com%2Fapi%2Fguilds%2F879482948099919903%2Fwidget.json&style=for-the-badge"/></a>
  </a>
</p>


<!-- TABLE OF CONTENTS -->
<details>
<summary>Table of Contents</summary><p>

1. [About The Project](#about-the-project)
   - [Built With](#built-with)
2. [Getting Started](#getting-started)
   - [Prerequisites](#prerequisites)
   - [Installation](#installation)
3. [How to use](#how-to-use)
4. [Configuration](#configuration)
5. [Roadmap and known issues](#roadmap-and-known-issues)
6. [Contributing](#contributing)
7. [License](#license)
8. [Testing](#testing)

</p></details>

<!-- ABOUT THE PROJECT -->

## About The Project

This is a rewrite in TS of the very popular 2bored2wait project. This can be used to wait out the long 2b2t.org queue without you having to login to the server! It can calculate how much time is left and it has a functional AntiAFK system! This proxy server is controlable through the webserver (that it hosts locally), the console, and the discord bot. A full list of commands is under [How to use](#how-to-use)

### Built With

<a href="https://github.com/rob9315/2b2wTS">
  <img align="center" src="https://github-readme-stats.vercel.app/api/top-langs/?username=rob9315&repo=2b2wTS&layout=compact&hide_title=true" />
</a>


<!-- GETTING STARTED -->

# Getting Started

To get a local copy up and running follow these simple steps.

## Prerequisites

Please optain all required items

- A discord bot (optional) ([detailed instructions](https://discordpy.readthedocs.io/en/stable/discord.html))
- Node 16 [Node Downloads](https://nodejs.org/)
- Git [Git Downloads](https://git-scm.com/downloads)

## Installation

1. Download and install [node.js](https://nodejs.org/) version 16 or above and [git](https://git-scm.com). You need git even if you download the repository as zip because it is to install the dependencies via npm.
2. Open a terminal then clone this repo then cd into folder:
```sh
 git clone https://github.com/rob9315/2b2wts
 cd 2b2wts
```
3. Run `npm install` to install the required libraries
4. Start the program with `npm start`.


# Configuration

- You can change all credentials and whether you want update messages by simply editing the values in local.js or deleting that file.

# How to use

1. Read the code to ensure I'm not stealing your credentials. I'm not, but you shouldn't take my word for it. If you don't know how to read it, downloading stuff off the internet and giving it your password is probably a bad idea anyway.
2. Run `npm start`
3. Follow the instructions on screen to setup.
4. Refer to [Commands](##commands) on how to use 2b2wTS from the console. Otherwise keep on reading for the web interface.
5. Now open a browser and navigate to http://localhost: your web port here (default 80).
6. Press the "Start queuing" button. The queue position indicator auto-updates, but sometimes it takes a while to start counting (like 1 min).
7. Once the queue reaches a low number, connect to the Minecraft server at address `localhost`.
8. After you log off, click the "stop queuing" button. This is really important, as you will not actually disconnect from 2b2t until you do that.

## Commands

All commands can be used through discord or simply typed in the console window.

- `start` will start the queue. It takes between 15-30 seconds for the bot to update with the queue position.
- `start 14:00` will start at 2pm.
- `play 8:00` will try to calculate the right time to join so you can play at 8:00
- `update` will send an update to the current channel with your position and ETA.
- `stop` will stop the queue.

<!-- CONTRIBUTING -->


## License

Distributed under the GPL-3.0 License. See [this](LICENSE) for more information.


