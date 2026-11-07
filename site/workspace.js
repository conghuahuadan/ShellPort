(() => {
  'use strict';
  const root = document.getElementById('interactive-workspace');
  if (!root) return;
  const en = document.documentElement.lang === 'en';
  const t = (zh, english) => en ? english : zh;
  const escape = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
  const paths = {
    terminal: 'm4 5 6 5-6 5m9 1h7', server: 'M3 3h18v7H3zM3 14h18v7H3zM6 6h.01M6 17h.01',
    folder: 'M3 6h7l2 2h9v12H3z', file: 'M5 3h9l5 5v13H5zM14 3v6h5M8 13h8M8 17h6',
    monitor: 'M3 3h18v13H3zM8 21h8m-4-5v5M6 11l3-4 4 6 4-5 2 2',
    right: 'M3 3h18v18H3zM12 3v18', down: 'M3 3h18v18H3zM3 12h18', close: 'm6 6 12 12M6 18 18 6',
    sun: 'M12 3V1m0 22v-2M3 12H1m22 0h-2M5 5 3 3m18 18-2-2M5 19l-2 2M21 3l-2 2M17 12a5 5 0 1 1-10 0 5 5 0 0 1 10 0',
    moon: 'M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11', star: 'm12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1z',
    transfer: 'M7 3v17m-4-4 4 4 4-4M17 21V4m-4 4 4-4 4 4', chevron: 'm9 5 7 7-7 7', sidebar: 'M3 3h18v18H3zM8 3v18',
  };
  const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name] || paths.file}"/></svg>`;
  const hosts = [
    { id: 'production', name: t('公网服务器', 'Production'), ip: '192.0.2.144', user: 'root', os: 'Ubuntu 24.04 LTS', memory: '8 GB', cpu: 16 },
    { id: 'staging', name: t('测试服务器', 'Staging'), ip: '198.51.100.24', user: 'deploy', os: 'Debian 12', memory: '4 GB', cpu: 8 },
  ];
  let nextPane = 1;
  const line = (text, tone = '') => ({ text, tone });
  function makePane(host, second = false) {
    return { id: nextPane++, draft: '', lines: second ? [
      line(`${host.user}@${host.name}:~$ uptime`, 'command'),
      line('14:08:22 up 12 days, 3:41, 2 users, load average: 0.12, 0.18, 0.09'),
      line(''), line(t('输入 help 查看可用命令。', 'Type help to see available commands.'), 'muted'),
    ] : [
      line(`Welcome to ${host.os}`, 'success'), line(''),
      line(`${host.user}@${host.name}:~$ ls -la ~/projects`, 'command'),
      line('drwxr-xr-x  4 deploy deploy 4096 Nov 07 09:00 shellport/'),
      line('drwxr-xr-x  3 deploy deploy 4096 Nov 07 09:00 website/'),
      line('-rw-r--r--  1 deploy deploy  256 Nov 07 09:00 README.md'), line(''),
      line(`${host.user}@${host.name}:~$ tail -f /var/log/app.log`, 'command'),
      line('09:00:15 [INFO]  api GET /health  status=200  healthy', 'success'),
      line('09:00:16 [DEBUG] worker queue=3  duration=2ms', 'muted'),
      line('09:00:17 [INFO]  deploy release ready  v0.1.3', 'success'),
      line('09:00:18 [WARN]  gateway retry=2  backoff=500ms', 'warning'), line(''),
      line(`${host.user}@${host.name}:~$ pwd`, 'command'), line(host.user === 'root' ? '/root' : '/home/deploy'), line(''),
      line(t('输入 help 查看可用命令。', 'Type help to see available commands.'), 'muted'),
    ] };
  }
  const sessions = new Map(hosts.map(host => {
    const pane = makePane(host);
    return [host.id, { files: true, monitor: window.matchMedia('(min-width: 701px)').matches, fileTab: 'tree', path: host.user === 'root' ? '/root' : '/home/deploy', expanded: new Set(['root', 'projects']), panes: [pane], activePane: pane.id, layout: 'right', document: '', selectedFile: '', monitorDetails: false }];
  }));
  const state = { host: hosts[0].id, view: 'terminal', light: false, collapsed: false };
  const currentHost = () => hosts.find(host => host.id === state.host);
  const session = () => sessions.get(state.host);
  const button = (action, label, glyph, extra = '') => `<button type="button" data-action="${action}" data-focus="${action}" aria-label="${escape(label)}" ${extra}>${glyph ? icon(glyph) : ''}<span>${escape(label)}</span></button>`;
  const tree = [
    { id: 'bin', name: 'bin', children: [{ id: 'bash', name: 'bash' }, { id: 'ls', name: 'ls' }] },
    { id: 'etc', name: 'etc', children: [{ id: 'app-conf', name: 'app.conf' }] },
    { id: 'home', name: 'home', children: [{ id: 'deploy', name: 'deploy', children: [] }] },
    { id: 'opt', name: 'opt', children: [{ id: 'apps', name: 'apps', children: [] }] },
    { id: 'root', name: 'root', children: [
      { id: 'cache', name: '.cache', children: [] }, { id: 'config', name: '.config', children: [] },
      { id: 'projects', name: 'projects', children: [
        { id: 'shellport', name: 'shellport', children: [{ id: 'readme', name: 'README.md' }] },
        { id: 'website', name: 'website', children: [{ id: 'html', name: 'index.html' }] },
        { id: 'deploy-script', name: 'deploy.sh' },
      ] }, { id: 'workspace', name: 'workspace', children: [] }, { id: 'root-readme', name: 'README.md' },
    ] },
    ...['srv', 'tmp', 'usr', 'var'].map(name => ({ id: name, name, children: name === 'var' ? [{ id: 'log', name: 'log', children: [{ id: 'app-log', name: 'app.log' }] }] : [] })),
  ];
  function treeRows(nodes, depth = 0, parent = '') {
    return nodes.map(node => {
      const path = `${parent}/${node.name}`;
      const folder = Boolean(node.children);
      const expanded = session().expanded.has(node.id);
      return `<div role="treeitem" ${folder ? `aria-expanded="${expanded}"` : ''}><button type="button" class="ws-tree-row ${session().selectedFile === node.id ? 'selected' : ''}" style="--depth:${depth}" data-action="${folder ? 'folder' : 'file'}" data-node="${node.id}" data-path="${escape(path)}" data-name="${escape(node.name)}" data-focus="node-${node.id}">${folder ? `<span class="ws-chevron ${expanded ? 'open' : ''}">${icon('chevron')}</span>` : '<span class="ws-indent"></span>'}${icon(folder ? 'folder' : 'file')}<span>${escape(node.name)}</span></button>${folder && expanded && node.children.length ? `<div role="group">${treeRows(node.children, depth + 1, path)}</div>` : ''}</div>`;
    }).join('');
  }
  function filesPanel() {
    const s = session();
    let content;
    if (s.fileTab === 'tree') content = `<div class="ws-path" title="${escape(s.path)}">${icon('folder')}<span>${escape(s.path)}</span></div><div class="ws-panel-label">${t('远程目录', 'Remote directory')}</div><div role="tree" aria-label="${t('文件树', 'File tree')}">${treeRows(tree)}</div>`;
    else if (s.fileTab === 'favorites') content = `<div class="ws-panel-label">${t('常用目录', 'Saved paths')}</div>${['/root/projects', '/var/log', '/etc'].map(path => `<button type="button" class="ws-favorite" data-action="favorite" data-path="${path}" data-focus="favorite-${path}">${icon('star')}<span>${path}</span>${icon('chevron')}</button>`).join('')}`;
    else content = `<div class="ws-panel-label">${t('已完成', 'Completed')} · 2</div>${[['release.tar.gz', '2.4 MB'], ['app.conf', '1.2 KB']].map(([name, size]) => `<div class="ws-transfer">${icon('file')}<div><strong>${name}</strong><small>${size} · ${t('已完成', 'Completed')}</small><div class="ws-transfer-bar"></div></div><span>✓</span></div>`).join('')}`;
    return `<aside class="ws-files" aria-label="${t('远程文件', 'Remote files')}"><div class="ws-file-tabs" role="tablist" aria-label="${t('文件面板', 'File panel')}">${[['tree', t('文件树', 'Files'), 'folder'], ['favorites', t('收藏', 'Saved'), 'star'], ['transfers', t('传输', 'Transfers'), 'transfer']].map(([tab, label, glyph]) => `<button type="button" role="tab" id="ws-file-${tab}" aria-selected="${s.fileTab === tab}" aria-controls="ws-file-content" tabindex="${s.fileTab === tab ? 0 : -1}" data-action="file-tab" data-tab="${tab}" data-focus="file-tab-${tab}">${icon(glyph)}${label}</button>`).join('')}</div><div class="ws-file-content" id="ws-file-content" role="tabpanel" aria-labelledby="ws-file-${s.fileTab}">${content}</div><div class="ws-files-footer">${icon('folder')}<span>${escape(s.path.split('/').pop() || '/')}</span></div></aside>`;
  }
  const documents = {
    'README.md': '# ShellPort\n\nYour servers. Your workflow. Connected.\n\n## Workspace\n\n- SSH terminals and split panes\n- Files and SFTP transfers\n- System monitoring\n\n## Getting started\n\nOpen a connection and make yourself at home.',
    'app.conf': '[server]\nlisten = 0.0.0.0\nport = 8080\n\n[logging]\nlevel = info\npath = /var/log/app.log\n\n[worker]\nconcurrency = 4',
    'deploy.sh': '#!/usr/bin/env bash\nset -euo pipefail\n\necho "Preparing release…"\ncd ~/projects/website\necho "Release ready."',
    'index.html': '<!doctype html>\n<html lang="en">\n  <head><title>Hello, ShellPort</title></head>\n  <body>\n    <h1>Your next workspace</h1>\n  </body>\n</html>',
    'app.log': '09:00:15 [INFO]  api GET /health status=200\n09:00:16 [DEBUG] worker queue=3 duration=2ms\n09:00:17 [INFO]  release ready\n09:00:18 [WARN]  gateway retry=2 backoff=500ms',
  };
  function terminalPanel() {
    const s = session(), host = currentHost();
    return `<section class="ws-terminals" aria-label="${t('终端工作区', 'Terminal workspace')}"><div class="ws-panes ${s.panes.length > 1 ? `split-${s.layout}` : ''}">${s.panes.map((pane, index) => `<section class="ws-pane ${s.activePane === pane.id ? 'active' : ''}" data-pane="${pane.id}" aria-label="${t('屏幕', 'Pane')} ${index + 1}"><div class="ws-pane-heading"><span><i class="ws-dot"></i>${escape(host.name)}</span><span>${t('屏幕', 'Pane')} ${index + 1}${s.panes.length > 1 ? `<button type="button" class="ws-icon-button" data-action="close-pane" data-pane="${pane.id}" data-focus="close-${pane.id}" aria-label="${t('关闭屏幕', 'Close pane')} ${index + 1}">${icon('close')}</button>` : ''}</span></div><div class="ws-output" tabindex="0" aria-label="${t('终端输出', 'Terminal output')}">${pane.lines.map(item => `<div class="ws-line ${item.tone}">${escape(item.text) || ' '}</div>`).join('')}</div><form class="ws-command" data-pane="${pane.id}"><label class="ws-prompt" for="ws-input-${pane.id}">${escape(host.user)}@${escape(host.name)}:~$</label><input id="ws-input-${pane.id}" data-focus="input-${pane.id}" name="command" autocomplete="off" spellcheck="false" maxlength="160" value="${escape(pane.draft)}" placeholder="${t('输入 help 查看命令', 'Type help for commands')}" aria-label="${t('命令输入', 'Command input')} ${index + 1}"><button type="submit" aria-label="${t('发送命令', 'Send command')}">↵</button></form></section>`).join('')}</div>${s.document ? `<section class="ws-document" aria-label="${t('文件内容', 'File contents')}"><div class="ws-document-heading">${icon('file')}<strong>${escape(s.document)}</strong><span>${t('只读', 'Read only')}</span>${button('close-document', t('关闭', 'Close'), 'close')}</div><pre>${escape(documents[s.document] || t('此文件暂不支持文本查看。', 'Text preview is not available for this file.'))}</pre></section>` : ''}</section>`;
  }
  function monitorPanel() {
    const host = currentHost(), s = session();
    return `<aside class="ws-monitor" aria-label="${t('系统监控', 'System monitoring')}"><section class="ws-monitor-card"><div class="ws-card-heading">${icon('server')}<strong>${t('系统', 'System')}</strong></div><div class="ws-host-ip">${host.ip}</div><p>${host.os}</p><dl><div><dt>${t('时区', 'Time zone')}</dt><dd>Asia/Shanghai</dd></div><div><dt>${t('运行时间', 'Uptime')}</dt><dd>12d 3h 41m</dd></div></dl></section><section class="ws-monitor-card"><div class="ws-card-heading">${icon('monitor')}<strong>${t('资源使用', 'Resources')}</strong>${button('monitor-details', t('详情', 'Details'), '', `aria-expanded="${s.monitorDetails}"`)}</div>${[['CPU', `${host.cpu}%`, host.cpu, '4 cores'], [t('内存', 'Memory'), '33.5%', 33.5, `2.7 / ${host.memory}`], [t('交换内存', 'Swap'), '0%', 0, '0 / 2 GB']].map(([label, value, percent, detail]) => `<div class="ws-resource"><div><span>${label}</span><strong>${value}</strong></div><div class="ws-meter"><i style="width:${percent}%"></i></div><small>${detail}</small></div>`).join('')}${s.monitorDetails ? `<dl class="ws-extra-details"><div><dt>${t('进程', 'Processes')}</dt><dd>128</dd></div><div><dt>${t('负载', 'Load')}</dt><dd>0.12 / 0.18 / 0.09</dd></div><div><dt>${t('架构', 'Architecture')}</dt><dd>x86_64</dd></div></dl>` : ''}</section><section class="ws-monitor-card"><div class="ws-card-heading">${icon('transfer')}<strong>${t('网络', 'Network')}</strong><span>eth0</span></div><svg class="ws-network" viewBox="0 0 240 52" aria-label="${t('网络速率趋势', 'Network activity trend')}" role="img"><path d="M0 34 20 29 40 32 60 14 80 22 100 9 120 17 140 10 160 27 180 20 200 28 220 8 240 15" stroke="#91c9a1"/><path d="M0 45 20 40 40 44 60 32 80 37 100 28 120 33 140 27 160 41 180 35 200 39 220 26 240 32" stroke="#8eb5d0"/></svg><dl><div><dt>↑ ${t('上传', 'Upload')}</dt><dd>16.3 KB/s</dd></div><div><dt>↓ ${t('下载', 'Download')}</dt><dd>9.4 KB/s</dd></div></dl></section><section class="ws-monitor-card"><div class="ws-card-heading">${icon('server')}<strong>${t('磁盘', 'Disk')}</strong><span>ext4</span></div><div class="ws-resource"><div><span>/</span><strong>34%</strong></div><div class="ws-meter"><i style="width:34%"></i></div><small>27.2 / 80 GB</small></div></section></aside>`;
  }
  function render(focus = '') {
    const s = session();
    root.dataset.theme = state.light ? 'light' : 'dark';
    root.innerHTML = `<div class="ws-shell ${state.collapsed ? 'nav-collapsed' : ''}" role="region" aria-label="${t('ShellPort 交互工作区', 'ShellPort interactive workspace')}"><nav class="ws-nav" aria-label="${t('工作区导航', 'Workspace navigation')}"><div class="ws-nav-top">${button('hosts', t('主机', 'Hosts'), 'server', `class="${state.view === 'hosts' ? 'active' : ''}"`)}${button('terminal', t('终端', 'Terminal'), 'terminal', `class="${state.view === 'terminal' ? 'active' : ''}"`)}</div><div class="ws-nav-bottom">${button('collapse', t(state.collapsed ? '展开侧栏' : '收起侧栏', state.collapsed ? 'Expand' : 'Collapse'), 'sidebar', `aria-expanded="${!state.collapsed}" title="${t('切换导航侧栏', 'Toggle navigation')}"`)}${button('theme', t(state.light ? '深色外观' : '浅色外观', state.light ? 'Dark theme' : 'Light theme'), state.light ? 'moon' : 'sun', `title="${t('切换深浅外观', 'Switch dark and light themes')}"`)}</div></nav><div class="ws-main"><div class="ws-toolbar"><div class="ws-host-tabs" role="tablist" aria-label="${t('主机连接', 'Host connections')}">${hosts.map(host => `<button type="button" role="tab" id="ws-host-${host.id}" aria-selected="${state.host === host.id}" aria-controls="ws-content" tabindex="${state.host === host.id ? 0 : -1}" data-action="host" data-host="${host.id}" data-focus="host-${host.id}"><i class="ws-dot"></i>${escape(host.name)}</button>`).join('')}</div><div class="ws-tools">${button('split-right', t('左右分屏', 'Split right'), 'right', `aria-pressed="${s.panes.length > 1 && s.layout === 'right'}" title="${t('左右分屏', 'Split right')}"`)}${button('split-down', t('上下分屏', 'Split down'), 'down', `aria-pressed="${s.panes.length > 1 && s.layout === 'down'}" title="${t('上下分屏', 'Split down')}"`)}${button('files', t('文件', 'Files'), 'folder', `aria-pressed="${s.files}"`)}${button('monitor', t('监控', 'Monitor'), 'monitor', `aria-pressed="${s.monitor}"`)}</div></div><div class="ws-body" id="ws-content" role="tabpanel" aria-labelledby="ws-host-${state.host}">${state.view === 'hosts' ? `<section class="ws-host-list"><h3>${t('连接你的下一台服务器', 'Your next connection')}</h3><p>${t('选择主机，进入它的工作空间。', 'Choose a host to open its workspace.')}</p><div>${hosts.map(host => `<button type="button" class="ws-host-card" data-action="host" data-host="${host.id}" data-focus="card-${host.id}">${icon('server')}<strong>${escape(host.name)}</strong><code>${host.ip}</code><span>${host.os}</span><span class="ws-host-open">${t('进入终端', 'Open terminal')} →</span></button>`).join('')}</div></section>` : `${s.files ? filesPanel() : ''}${terminalPanel()}${s.monitor ? monitorPanel() : ''}`}</div><div class="ws-status"><span><i class="ws-dot"></i>${t('已连接', 'Connected')} · ${currentHost().ip}</span><span>${s.panes.length} ${t('屏', s.panes.length === 1 ? 'pane' : 'panes')} · UTF-8</span></div></div></div>`;
    root.classList.add('workspace-ready');
    root.querySelectorAll('.ws-output').forEach(output => { output.scrollTop = output.scrollHeight; });
    if (focus) root.querySelector(`[data-focus="${CSS.escape(focus)}"]`)?.focus({ preventScroll: true });
  }
  root.addEventListener('input', event => {
    const form = event.target.closest('.ws-command');
    if (!form) return;
    const pane = session().panes.find(item => item.id === Number(form.dataset.pane));
    if (pane) pane.draft = event.target.value;
  });
  root.addEventListener('pointerdown', event => {
    const pane = event.target.closest('.ws-pane');
    if (!pane) return;
    session().activePane = Number(pane.dataset.pane);
    root.querySelectorAll('.ws-pane').forEach(item => item.classList.toggle('active', item === pane));
  });
  root.addEventListener('click', event => {
    const target = event.target.closest('[data-action]');
    if (!target || !root.contains(target)) return;
    const s = session();
    const action = target.dataset.action;
    if (action === 'host') { state.host = target.dataset.host; state.view = 'terminal'; }
    else if (action === 'hosts' || action === 'terminal') state.view = action;
    else if (action === 'files' || action === 'monitor') { s[action] = !s[action]; state.view = 'terminal'; }
    else if (action === 'theme') state.light = !state.light;
    else if (action === 'collapse') state.collapsed = !state.collapsed;
    else if (action === 'file-tab') s.fileTab = target.dataset.tab;
    else if (action === 'folder') {
      if (s.expanded.has(target.dataset.node)) s.expanded.delete(target.dataset.node); else s.expanded.add(target.dataset.node);
      s.path = target.dataset.path;
      s.selectedFile = target.dataset.node;
    } else if (action === 'file') { s.document = target.dataset.name; s.selectedFile = target.dataset.node; }
    else if (action === 'close-document') s.document = '';
    else if (action === 'favorite') {
      s.path = target.dataset.path; s.fileTab = 'tree';
      const ids = s.path === '/root/projects' ? ['root', 'projects'] : s.path === '/var/log' ? ['var', 'log'] : ['etc'];
      ids.forEach(id => s.expanded.add(id)); s.selectedFile = ids.at(-1);
    } else if (action === 'monitor-details') s.monitorDetails = !s.monitorDetails;
    else if (action.startsWith('split-')) {
      state.view = 'terminal'; s.document = ''; s.layout = action === 'split-down' ? 'down' : 'right';
      if (window.matchMedia('(max-width: 700px)').matches) { s.files = false; s.monitor = false; }
      if (s.panes.length === 1) s.panes.push(makePane(currentHost(), true));
      s.activePane = s.panes[1].id;
    } else if (action === 'close-pane') {
      if (s.panes.length > 1) s.panes = s.panes.filter(pane => pane.id !== Number(target.dataset.pane));
      s.activePane = s.panes[0].id;
    } else return;
    const focus = action === 'host' ? `host-${state.host}` : action === 'close-document' ? `node-${s.selectedFile}` : action === 'close-pane' ? `input-${s.activePane}` : target.dataset.focus;
    render(focus);
  });
  root.addEventListener('keydown', event => {
    if (event.key === 'Escape' && session().document) {
      session().document = ''; render(`node-${session().selectedFile}`); return;
    }
    const treeRow = event.target.closest('.ws-tree-row');
    if (treeRow && ['ArrowDown', 'ArrowUp', 'ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
      event.preventDefault();
      const rows = [...root.querySelectorAll('.ws-tree-row')];
      const index = rows.indexOf(treeRow);
      const expanded = treeRow.parentElement.getAttribute('aria-expanded');
      if (event.key === 'ArrowRight') {
        if (expanded === 'false') treeRow.click();
        else if (expanded === 'true') treeRow.parentElement.querySelector('[role="group"] .ws-tree-row')?.focus();
      } else if (event.key === 'ArrowLeft') {
        if (expanded === 'true') treeRow.click();
        else treeRow.parentElement.parentElement.closest('[role="treeitem"]')?.querySelector('.ws-tree-row')?.focus();
      } else {
        const next = event.key === 'Home' ? 0 : event.key === 'End' ? rows.length - 1 : Math.min(rows.length - 1, Math.max(0, index + (event.key === 'ArrowDown' ? 1 : -1)));
        rows[next]?.focus();
      }
      return;
    }
    const tab = event.target.closest('[role="tab"]');
    if (!tab || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    const tabs = [...tab.parentElement.querySelectorAll('[role="tab"]')];
    const index = tabs.indexOf(tab);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
    event.preventDefault(); tabs[next].click();
  });
  root.addEventListener('submit', event => {
    const form = event.target.closest('.ws-command');
    if (!form) return;
    event.preventDefault();
    const s = session(), host = currentHost();
    const pane = s.panes.find(item => item.id === Number(form.dataset.pane));
    if (!pane) return;
    const command = pane.draft.trim();
    if (!command) return;
    pane.draft = ''; s.activePane = pane.id;
    pane.lines.push(line(`${host.user}@${host.name}:~$ ${command}`, 'command'));
    if (command === 'clear') pane.lines = [];
    else {
      let result;
      if (command === 'help') result = ['pwd · ls · whoami · uptime · uname -a', 'cat README.md · echo <text> · clear'];
      else if (command === 'pwd') result = [host.user === 'root' ? '/root' : '/home/deploy'];
      else if (command === 'ls' || command === 'ls -la') result = ['projects/   workspace/   README.md'];
      else if (command === 'whoami') result = [host.user];
      else if (command === 'uptime') result = ['up 12 days, 3:41, load average: 0.12, 0.18, 0.09'];
      else if (command === 'uname -a') result = ['Linux shellport 6.8.0-generic x86_64 GNU/Linux'];
      else if (command === 'cat README.md') result = documents['README.md'].split('\n');
      else if (command.startsWith('echo ')) result = [command.slice(5)];
      else result = [t('此处支持的命令请通过 help 查看。', 'Type help to see the commands available here.')];
      pane.lines.push(...result.map(text => line(text)));
      pane.lines = pane.lines.slice(-100);
    }
    render(`input-${pane.id}`);
  });
  render();
})();
