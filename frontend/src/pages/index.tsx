import Navbar from "../widgets/navbar/Navbar";
import Hero from "../widgets/hero/Hero";
import AppFooter from "../widgets/footer/AppFooter";
import RecruitList from "../widgets/team/RecruitList";
import ContestList from "../widgets/contest/ContestList";

const IndexPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 text-slate-900">
      <Navbar />
      <Hero />
      <RecruitList />
      <ContestList />
      <AppFooter />
    </div>
  );
};

export default IndexPage;
