# Change Log

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2024-06-26

- Initial release

## [0.2.0] - 2024-06-29

### Added

- Theme-responsive icons in projects view
- Source files in projects view
- Test bench files in projects view
- Ability to add & remove source files
- Ability to add & remove test bench files

### Fixed

- Improved background terminal execution compatibility issues (no longer using '&&', 'cmd /c' and other terminal-specific commands)
- Opening and reading projects now uses vitis-run
- Internal paths now use VS Code's built-in URI format instead of simple strings

### Changed

- Minor logo adjustments

## [0.2.1] - 2024-06-29

### Changed

- Project view items now preserve collapsed/expanded state on reload
- Greatly improved loading & reloading times in projects view

## [0.2.2] -- 2024-07-01

### Removed

- Removed "Debug C Simulation" button
- Running C Simulation no longer outputs to output channel

### Changed

- "Run C Simulation" now builds csim binaries & runs a debug session, showing build errors in the Problems output
