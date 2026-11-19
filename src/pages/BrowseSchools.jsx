import { useState } from "react";
import { AlertCircle, Building2 } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import useSchools from "../components/BrowseSchools/UseSchools";
import PageHero from "../components/BrowseSchools/PageHero";
import SearchBar from "../components/BrowseSchools/SearchBar";
import SectionHeader from "../components/home/SectionHeader";
import WilayaFilter from "../components/BrowseSchools/WilayaFilter";
import SchoolCard from "../components/BrowseSchools/SchoolCard";
import SchoolCardSkeleton from "../components/BrowseSchools/SchoolCardSkeleton";
import Pagination from "../components/BrowseSchools/Pagination";
import EmptyState from "../components/BrowseSchools/EmptyState";

const PAGE_SIZE = 12;

export default function BrowseSchools() {
  const { t, dir } = useLanguage();
  const [search, setSearch] = useState("");
  const [wilaya, setWilaya] = useState("");
  const [page, setPage] = useState(0);

  const { items, total, serverPaged, loading, error } = useSchools({ wilaya, page, pageSize: PAGE_SIZE });

  // Text search runs on whatever is loaded (everything when the API isn't paginated,
  // the current page when it is).
  const q = search.trim().toLowerCase();
  const matches = q
    ? items.filter((s) =>
        [s.schoolName, s.wilaya, s.commune].some((v) => v?.toLowerCase().includes(q))
      )
    : items;

  const visible = serverPaged ? matches : matches.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const count = serverPaged && !q ? total : matches.length;
  const totalPages = Math.max(1, Math.ceil((serverPaged ? total : matches.length) / PAGE_SIZE));

  const changeWilaya = (value) => { setPage(0); setWilaya(value); };
  const changeSearch = (value) => { setPage(0); setSearch(value); };

  const goToPage = (p) => {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div dir={dir} className="min-h-screen bg-ivory">
      <PageHero title={t("browseSchools.hero.title")} subtitle={t("browseSchools.hero.subtitle")}>
        <SearchBar
          value={search}
          onChange={changeSearch}
          placeholder={t("browseSchools.hero.searchPlaceholder")}
        />
      </PageHero>

      <section className="container mx-auto px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <SectionHeader
          tag={loading ? t("browseSchools.loading") : t("browseSchools.resultCount", { count })}
          title={t("browseSchools.availableTitle")}
        />

        <div className="mb-10 border border-gold/25 bg-white p-4 sm:p-5">
          <WilayaFilter value={wilaya} onChange={changeWilaya} />
        </div>

        {error ? (
          <EmptyState icon={AlertCircle} tone="error" title={t("browseSchools.loadError")} />
        ) : loading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }, (_, i) => <SchoolCardSkeleton key={i} />)}
          </div>
        ) : visible.length === 0 ? (
          <EmptyState
            icon={Building2}
            title={t("browseSchools.emptyTitle")}
            subtitle={t("browseSchools.emptySubtitle")}
          />
        ) : (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((school, i) => (
                <SchoolCard key={school.schoolId} school={school} delay={(i % 3) * 0.08} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
          </>
        )}
      </section>
    </div>
  );
}