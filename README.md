## Introduction

A [VS Code](https://code.visualstudio.com/) extension to provide a means of managing and developing Vitis HLS projects outside of the official Vitis HLS IDE.

NOTE: This extension is still very much in its early development stages, so may result in modifying your files in unintended ways. Please proceed with caution, I take to responsibility for files that become edited, removed, corrupted or created in unintended ways. Here be dragons!

## Features

- List and detect multiple Vitis HLS projects from within one workspace
- Run C simulation
- Debug C simulation (WIP)
- Run C synthesis
- Run C/RTL cosimulation

## Requirements

- [Vitis &amp; Vitis HLS](https://www.xilinx.com/support/download.html)

## Extension Settings

This extension contributes the following settings:

- `vitis-hls-ide.vitisPath`: Path to the Vitis installation directory.
- `vitis-hls-ide.hlsPath`: Path to the Vitis HLS installation directory.

## Known Issues

- Debug C simulation instantly closing

## Release Notes

### 0.0.1

Initial release
