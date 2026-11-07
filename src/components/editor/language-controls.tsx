"use client";
import { useState } from "react";
import { Check, Globe2, X } from "lucide-react";
import { useLocale } from "@/resume/locale";
import { useResume } from "@/resume/store";
import { sampleResume } from "@/resume/sample";
import { compatibleFont } from "@/resume/presentation";
import type { Language } from "@/resume/translations";
import { Button, Dialog } from "../ui";
import { Brand } from "../brand";

export function LanguageControls() {
  const { language, ready, chosen, choose } = useLocale();
  const documentReady = useResume((state) => state.ready);
  const documentLanguage = useResume((state) => state.resume.design.language);
  const [settings, setSettings] = useState(false);
  const ar = language === "ar";
  const firstVisit = ready && documentReady && !chosen;
  function start(language: Language) {
    if (useResume.getState().pristine) useResume.getState().replace(sampleResume(language));
    choose(language);
  }
  return <>
    <Button variant="icon" className="language-button" aria-label={ar ? "إعدادات اللغة" : "Language settings"} title={ar ? "اللغة" : "Language"} onClick={() => setSettings(true)}><Globe2 size={17} /><span>{ar ? "ع" : "EN"}</span></Button>
    <Dialog.Root open={firstVisit || settings} onOpenChange={(open) => { if (!firstVisit) setSettings(open); }}>
      <Dialog.Portal><Dialog.Overlay className="dialog-overlay" /><Dialog.Content className="dialog-content language-dialog" dir={firstVisit ? "ltr" : ar ? "rtl" : "ltr"}
        onEscapeKeyDown={(event) => { if (firstVisit) event.preventDefault(); }} onInteractOutside={(event) => { if (firstVisit) event.preventDefault(); }}>
        {firstVisit ? <>
          <Brand welcome />
          <Dialog.Title>Welcome to Cevora <span lang="ar" dir="rtl">أهلًا بك في سيفورا</span></Dialog.Title>
          <Dialog.Description>Choose your language to get started.<br /><span lang="ar" dir="rtl">اختر لغتك للبدء.</span></Dialog.Description>
          <div className="language-choices"><Button onClick={() => start("en")}><span lang="en">English</span><small>Left to right</small></Button><Button onClick={() => start("ar")}><span lang="ar" dir="rtl">العربية</span><small lang="ar" dir="rtl">من اليمين إلى اليسار</small></Button></div>
          <p className="language-footnote">You can change this later. <span lang="ar" dir="rtl">يمكنك تغيير اللغة لاحقًا.</span></p>
        </> : <>
          <div className="language-dialog-heading"><Dialog.Title>{ar ? "إعدادات اللغة" : "Language settings"}</Dialog.Title><Dialog.Close asChild><Button variant="icon" aria-label={ar ? "إغلاق" : "Close"}><X size={18} /></Button></Dialog.Close></div>
          <Dialog.Description>{ar ? "اختر لغة الواجهة والسيرة الذاتية بشكل مستقل." : "Choose your interface and résumé languages independently."}</Dialog.Description>
          <label className="field"><span>{ar ? "لغة الواجهة" : "Interface language"}</span><select className="input" value={language} onChange={(event) => choose(event.target.value as Language)}><option value="en">English</option><option value="ar">العربية</option></select></label>
          <label className="field"><span>{ar ? "لغة السيرة الذاتية" : "Résumé language"}</span><select className="input" value={documentLanguage} onChange={(event) => {
            const language = event.target.value as Language;
            useResume.getState().edit((resume) => ({ ...resume, design: { ...resume.design, language, font: compatibleFont(resume.design.font, language) } }));
          }}><option value="en">English · LTR</option><option value="ar">العربية · RTL</option></select></label>
          <p className="language-settings-note">{ar ? "تغيير لغة السيرة يضبط اتجاه النص والخطوط وعناوين الأقسام الجديدة. لن يُترجم المحتوى الحالي أو تتغير عناوينك المخصصة." : "Résumé language sets direction, compatible fonts, and new section defaults. Existing content and custom headings stay as written."}</p>
          <Dialog.Close asChild><Button variant="primary"><Check size={15} />{ar ? "تم" : "Done"}</Button></Dialog.Close>
        </>}
      </Dialog.Content></Dialog.Portal>
    </Dialog.Root>
  </>;
}
