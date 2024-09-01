# Vitis HLS IDE Extension for Visual Studio Code

> [!NOTE]
> This plugin is no longer in active development. If you would like to contribute, feel free to submit any pull requests on this repository and I may check it when I have time.
> As this plugin is in early development, it may modify your files in unintended ways, and may contain bugs. Please ensure you have backed up your data before using this extension. Here be dragons!

A [VS Code](https://code.visualstudio.com/) extension to provide a means of managing and developing Vitis HLS projects from the comfort of your VS Code IDE.

## Features

- Manage multiple Vitis HLS projects from within one workspace
- Run C simulation
- Debug C simulation (WIP)
- Run C synthesis
- Run C/RTL cosimulation
- Add & remove source & test bench files

## Requirements

- [Vitis &amp; Vitis HLS](https://www.xilinx.com/support/download.html)

## Extension Settings

This extension contributes the following settings:

- `vitis-hls-ide.vitisPath`: Path to the Vitis installation directory.
- `vitis-hls-ide.hlsPath`: Path to the Vitis HLS installation directory.

## Known Issues

- Debug C simulation instantly closing
