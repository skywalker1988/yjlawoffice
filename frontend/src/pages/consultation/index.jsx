/** 상담안내 페이지 — 히어로, 절차, 폼, FAQ, 지도 섹션을 조합하는 메인 컴포넌트 */
import useReveal from "../../hooks/useReveal";
import ConsultationHero from "./ConsultationHero";
import ConsultationSteps from "./ConsultationSteps";
import ConsultationForm from "./ConsultationForm";
import ConsultationFAQ from "./ConsultationFAQ";
import ConsultationMap from "./ConsultationMap";

export default function ConsultationPage() {
  const ref = useReveal();

  return (
    <div ref={ref}>
      <ConsultationHero />
      <ConsultationSteps />
      <ConsultationForm />
      <ConsultationFAQ />
      <ConsultationMap />
    </div>
  );
}
