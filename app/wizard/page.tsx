'use client';

import { useWizardStore } from '@/lib/wizardStore';
import Step1Creator from '@/components/wizard/Step1Creator';
import Step2Client from '@/components/wizard/Step2Client';
import Step3Machine from '@/components/wizard/Step3Machine';
import Step4MountStandard from '@/components/wizard/Step4MountStandard';
import Step5ItemList from '@/components/wizard/Step5ItemList';
import Step6Attachments from '@/components/wizard/Step6Attachments';
import Step6bVariants from '@/components/wizard/Step6bVariants';
import Step7ICT from '@/components/wizard/Step7ICT';
import Step8Costs from '@/components/wizard/Step8Costs';
import Step9Delivery from '@/components/wizard/Step9Delivery';
import Step10Confirm from '@/components/wizard/Step10Confirm';
import StepAttachStandard from '@/components/wizard/StepAttachStandard';

// チルトローテータ一式：従来の全ステップ
const TILT_LABELS = [
  '作成者情報', '見積先情報', 'ベースマシン', '取付方式・S規格',
  '品目一覧', 'アタッチメント選択', 'アタッチメント詳細', 'ICT情報', '費用・物流', '納期・場所', '確認・出力',
];
const TILT_STEPS = [
  Step1Creator, Step2Client, Step3Machine, Step4MountStandard,
  Step5ItemList, Step6Attachments, Step6bVariants, Step7ICT, Step8Costs, Step9Delivery, Step10Confirm,
];

// アタッチメントのみ：マシン・取付方式・チルトローテータ品目・ICTを省略
const ATTACH_LABELS = [
  '作成者情報', '見積先情報', 'S規格', 'アタッチメント選択', 'アタッチメント詳細', '費用・物流', '納期・場所', '確認・出力',
];
const ATTACH_STEPS = [
  Step1Creator, Step2Client, StepAttachStandard, Step6Attachments, Step6bVariants, Step8Costs, Step9Delivery, Step10Confirm,
];

export default function WizardPage() {
  const { quote_mode, currentStep, setStep } = useWizardStore();
  const isAttach = quote_mode === 'attachment';
  const STEPS = isAttach ? ATTACH_STEPS : TILT_STEPS;
  const STEP_LABELS = isAttach ? ATTACH_LABELS : TILT_LABELS;
  const activeStep = Math.min(currentStep, STEPS.length);
  const StepComponent = STEPS[activeStep - 1];

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800 text-center mb-4">engcon 見積もり作成</h1>

          <div className="flex overflow-x-auto gap-1 pb-2">
            {STEP_LABELS.map((label, i) => {
              const step = i + 1;
              const isDone = activeStep > step;
              const isCurrent = activeStep === step;
              return (
                <button
                  key={step}
                  onClick={() => isDone && setStep(step)}
                  disabled={!isDone}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition ${
                    isCurrent
                      ? 'bg-blue-600 text-white font-semibold'
                      : isDone
                      ? 'bg-blue-100 text-blue-700 hover:bg-blue-200 cursor-pointer'
                      : 'bg-gray-100 text-gray-400'
                  }`}
                >
                  {step}. {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm p-8">
          <StepComponent />
        </div>
      </div>
    </div>
  );
}
