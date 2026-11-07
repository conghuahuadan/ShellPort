<div align="center">

<img src="site/assets/appicon.png" width="96" height="96" alt="ShellPort icon" />

# ShellPort

[简体中文](README.md) · **English**

### Your servers. Your workflow. Connected.

An SSH desktop client for **macOS and Windows**.<br>
Bring terminals, files, and system monitoring into one workspace for smoother everyday remote work.

**[Download the latest release](https://github.com/conghuahuadan/ShellPort/releases/latest)** · [Product website](https://conghuahuadan.github.io/ShellPort/en.html) · [Release notes](https://github.com/conghuahuadan/ShellPort/releases) · [Feedback](https://github.com/conghuahuadan/ShellPort/issues)

macOS / Windows · Intel / Apple Silicon / ARM64 · Dark / Light

![ShellPort workspace with a file tree, SSH terminal, and system monitoring side by side](site/assets/workspace.webp)

</div>

## From connection to action, in one place

Watch resource usage while reading logs. Manage remote files right beside the terminal while deploying a project. ShellPort brings these everyday tasks together so you can stay focused on the work.

| Feature | What you can do |
| --- | --- |
| **Host management** | Organize hosts into groups, search your connections, and connect over SSH with a password or private key. |
| **Terminal workspace** | Switch between connections using tabs, work in horizontal or vertical splits, and search terminal output. Local terminals are supported too. |
| **Files and transfers** | Browse SFTP directories, bookmark paths, upload and download files, track transfers, and edit remote text files. |
| **System monitoring** | Keep CPU, memory, network, and disk activity beside the terminal. Explore processes, connections, and file systems. Available metrics depend on the target system and permissions. |
| **Backup and sync** | Export and import local configuration, or use your own WebDAV service to sync selected settings and manage cloud backups. |
| **Appearance and updates** | Choose a dark or light theme, customize terminal fonts and shortcuts, and check for and download updates in the app. |

## A workspace that keeps you in context

### Work side by side

Each split terminal works independently while the file and monitoring panels stay in view. Read logs in one pane and run commands in another.

![Two SSH terminals sharing file and monitoring panels](site/assets/split-terminal.webp)

### Organized hosts, in any light

Group production, development, and personal servers. Find a host by name, address, or username, and switch to a light theme when it suits your environment.

![Host groups, search, and information cards in the ShellPort light theme](site/assets/hosts-light.webp)

## Download

Open the **[latest release](https://github.com/conghuahuadan/ShellPort/releases/latest)** and choose the matching file under Assets.

| Your device | Look for | Installation |
| --- | --- | --- |
| Mac · Apple Silicon (M series) | `macos-arm64` | Open the `.dmg` and drag ShellPort into Applications |
| Mac · Intel | `macos-amd64` | Open the `.dmg` and drag ShellPort into Applications |
| Windows · Intel / AMD x64 | `windows-amd64` | Use `-setup.exe`, or extract the portable `.zip` |
| Windows · ARM64 | `windows-arm64` | Use `-setup.exe`, or extract the portable `.zip` |

On a Mac, check your chip in **About This Mac**. On Windows, check **Settings → System → About → System type**. ZIP packages for macOS are also available in the release assets.

**Before installing:** Check the release notes for signing status, system requirements, and installation guidance. Current macOS packages do not have Developer ID signing or Apple notarization, and Windows packages are unsigned, so your system may display a security prompt. The `SHA256SUMS.txt` attachment contains SHA-256 checksums for the packages.

## Get started

1. **Add a host:** Enter the address, port, username, and authentication details, and choose a group if needed.
2. **Open your workspace:** Connect and use the terminal. Open the file and monitoring panels or add a split when you need them.
3. **Keep your configuration:** Export a local backup or configure your own WebDAV service in the backup and sync settings.

You can also open a local terminal directly from the hosts page without creating an SSH host.

## Frequently asked questions

<details>
<summary><strong>What is this repository for?</strong></summary>

This is the public download and feedback repository for ShellPort. Find installers, release notes, and product information here, and share issues or suggestions.

</details>

<details>
<summary><strong>Is cloud sync required?</strong></summary>

No. You can manage hosts and use the terminal without configuring sync. WebDAV is optional: connect your own service and select what to sync when you need it.

</details>

<details>
<summary><strong>Are private keys included in backups or sync?</strong></summary>

No. Locally saved SSH private keys are excluded from exported backups and cloud sync. Add them again on a new device. Whether login passwords are included depends on your selected backup or sync scope. Backups still contain configuration such as host addresses, so keep them in a safe place.

</details>

<details>
<summary><strong>How do I report an issue or suggest an improvement?</strong></summary>

Open an [issue](https://github.com/conghuahuadan/ShellPort/issues) with your operating system, processor architecture, ShellPort version, steps to reproduce, expected result, and actual result. Screenshots and sanitized logs are helpful. Do not upload passwords, private keys, databases, local encryption key files, or unsanitized logs.

</details>

---

<div align="center">

**Make every remote session feel more at home.**

[Download ShellPort](https://github.com/conghuahuadan/ShellPort/releases/latest) · [Release notes](https://github.com/conghuahuadan/ShellPort/releases) · [Feedback and ideas](https://github.com/conghuahuadan/ShellPort/issues)

</div>
