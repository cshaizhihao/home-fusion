/*
 * @Author: kasuie
 * @Date: 2024-06-12 19:52:57
 * @LastEditors: kasuie
 * @LastEditTime: 2024-06-29 15:40:01
 * @Description:
 */
"use client";
import { motion } from "framer-motion";
import { AppConfig } from "@/config/config";
import { AppRules } from "@/lib/rules";
import { Form, FormObj } from "../ui/form/Form";
import { memo, useMemo, useRef, useState } from "react";
import { Button } from "../ui/button/Button";
import fetch from "@/lib/fetch";
import { useRouter } from "next/navigation";
import message from "@/components/message";
import { Accordion, AccordionItem } from "@nextui-org/accordion";
import Link from "next/link";

const MemoizedForm = memo(Form);

export const Settings = ({
  config,
  cardOpacity = 0.3,
}: {
  config: AppConfig;
  cardOpacity?: number;
}) => {
  const [result, setResult] = useState<FormObj>(config);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const onMerge = (data: FormObj, field?: string) => {
    setResult({
      ...result,
      ...(field ? { [field]: data } : data),
    });
  };

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    if (!file) return;
    setLoading(true);
    const reader = new FileReader();
    reader.onload = (e: any) => {
      try {
        const config = JSON.parse(e.target.result);
        config && onSubmit(config);
      } catch (error) {
        setLoading(false);
        message.error("JSON 文件加载失败");
      }
    };
    reader.readAsText(file);
  };

  const filteredRules = useMemo(() => {
    if (!keyword.trim()) return AppRules;
    const kw = keyword.trim().toLowerCase();
    return AppRules.filter((item) => item.title.toLowerCase().includes(kw));
  }, [keyword]);

  const isDirty = useMemo(() => {
    try {
      return JSON.stringify(result) !== JSON.stringify(config);
    } catch {
      return false;
    }
  }, [result, config]);

  const resetAll = () => setResult(config as any);

  const onSubmit = (data?: FormObj) => {
    setLoading(true);
    fetch
      .post("/api/config", data || result)
      .then((res) => {
        if (res.success) {
          message.success(data ? "上传成功，配置已更新~" : "保存成功~");
          router.refresh();
        } else {
          message.error(res.message || "操作失败！");
        }
      })
      .catch((_) => message.error("操作失败！"))
      .finally(() => setLoading(false));
  };

  return (
    <motion.div className="flex h-[85vh] w-[95vw] flex-col items-center gap-4 overflow-hidden rounded border border-white/15 bg-[#0b1220cc] p-4 text-white shadow-mio-link backdrop-blur-lg md:w-[65vw] [&_label]:text-white/90 [&_input]:text-white [&_textarea]:text-white">
      <div className="w-full">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-bold text-white">当前配置</h1>
          <div className="flex items-center gap-2 text-xs">
            <input
              ref={fileInputRef}
              onChange={handleFileChange}
              type="file"
              name="upload"
              accept=".json"
              hidden
            />
            <button
              className="rounded bg-white/10 px-2 py-1 hover:bg-white/20"
              onClick={() => fileInputRef?.current && fileInputRef.current.click()}
            >
              上传配置
            </button>
            <Link className="rounded bg-white/10 px-2 py-1 hover:bg-white/20" href={`/api/file`}>
              下载配置
            </Link>
          </div>
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索配置分组（如：背景、模块、音乐）"
            className="w-full rounded border border-white/20 bg-black/35 px-3 py-1 text-sm text-white placeholder:text-white/45 md:w-[360px]"
          />
          <span className={`text-xs ${isDirty ? "text-amber-300" : "text-emerald-300"}`}>
            {isDirty ? "有未保存更改" : "配置已同步"}
          </span>
        </div>
      </div>
      <Accordion
        showDivider
        className="mio-scroll flex w-full flex-col overflow-y-auto px-2"
        selectionMode="multiple"
      >
        {filteredRules?.map(({ title, rules, field }) => {
          const form = field ? (config as any)[field as any] : config;
          return (
            <AccordionItem
              key={title}
              aria-label={title}
              title={
                <span className="flex flex-nowrap items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-[var(--primary-color)]"></span>
                  <span className="font-semibold">{title}</span>
                </span>
              }
            >
              <MemoizedForm
                key={title}
                title={title}
                onMerge={(data: FormObj) => onMerge(data, field)}
                rules={rules}
                form={form}
              />
            </AccordionItem>
          );
        })}
      </Accordion>
      <div className="sticky bottom-0 z-10 flex w-full items-center justify-end gap-2 border-t border-white/10 bg-black/40 p-2 backdrop-blur">
        <Button className="rounded-2xl" onClick={resetAll}>重置</Button>
        <Button
          loading={loading}
          className="rounded-2xl"
          onClick={() => onSubmit()}
        >
          保存
        </Button>
      </div>
    </motion.div>
  );
};
