import Link from "next/link";
import { Verify } from "@/components/verify/Verify";
import { getConfig, mergeConfig } from "@/lib/config";
import { isAuthorizedByCookie } from "@/lib/auth";
import { AdminConsole } from "@/components/admin/AdminConsole";

export const revalidate = 0;

export default async function AdminPage() {
  const authorized = isAuthorizedByCookie();
  const appConfig = await getConfig();

  return (
    <main className="admin-console min-h-screen bg-[#0b0d12] p-4 text-white md:p-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Home Fusion 控制台</h1>
          <div className="flex gap-2 text-xs">
            <Link href="/" className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">返回主页</Link>
            <Link href="/config" className="rounded bg-white/10 px-3 py-1 hover:bg-white/20">配置页</Link>
          </div>
        </div>

        <div className="mb-4 rounded border border-white/15 bg-white/5 p-3 text-sm text-white/80">
          当前状态：{authorized ? "已登录（可编辑并发布配置）" : "未登录（请先输入密码）"}
        </div>

        {authorized ? (
          <AdminConsole config={mergeConfig(appConfig)} />
        ) : (
          <div className="pt-8">
            <Verify />
          </div>
        )}
      </section>
    </main>
  );
}
