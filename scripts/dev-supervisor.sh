#!/usr/bin/env bash
# dev-server 自愈监管（沙箱专用）：
# 现象：内核 OOM 杀掉过系统托管的 next-server（RSS 2.4GB / 4GB 沙箱），
#       且手动拉起的 dev server 也会被环境周期性回收（日志无崩溃、无新 OOM）。
# 对策：每 5s 探测 127.0.0.1:3000，无 200 响应即前台重启 bun run dev；
#       服务死→循环体返回→再次探测→再拉起。幂等，端口冲突时下一轮自愈。
cd /home/z/my-project || exit 1
LOG=dev-supervisor.log
echo "[$(date '+%F %T')] supervisor started (pid $$)" >> "$LOG"
while true; do
  code=$(curl -s -o /dev/null -m 3 -w "%{http_code}" http://127.0.0.1:3000/ 2>/dev/null)
  if [ "$code" != "200" ]; then
    echo "[$(date '+%F %T')] dev server down (code=${code:-none}) — restarting" >> "$LOG"
    bun run dev >> dev.log 2>&1
    echo "[$(date '+%F %T')] dev server exited (code=$?) — re-probe in 5s" >> "$LOG"
  fi
  sleep 5
done
