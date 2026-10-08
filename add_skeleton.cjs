const fs = require("fs");
let content = fs.readFileSync("src/components/RepositorioSection.tsx", "utf8");

const target = "{filteredMonografias.length === 0 ? (";
const replacement = `{isLoadingMonografias ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs animate-pulse flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="h-6 w-24 bg-slate-200 rounded-lg" />
                    <div className="h-6 w-16 bg-slate-200 rounded-lg" />
                  </div>
                  <div className="space-y-2 mb-4">
                    <div className="h-4 bg-slate-200 rounded-md w-full" />
                    <div className="h-4 bg-slate-200 rounded-md w-3/4" />
                  </div>
                  <div className="space-y-3 py-4 border-y border-slate-100">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-3.5 bg-slate-200 rounded w-3/4" />
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full shrink-0" />
                      <div className="space-y-1.5 w-full">
                        <div className="h-3 bg-slate-200 rounded w-1/2" />
                        <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-4">
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-full" />
                    <div className="h-3 bg-slate-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="h-9 bg-slate-200 rounded-xl flex-1" />
                  <div className="h-9 w-9 bg-slate-200 rounded-xl shrink-0" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : filteredMonografias.length === 0 ? (`;

if (content.includes(target)) {
  content = content.replace(target, replacement);
  fs.writeFileSync("src/components/RepositorioSection.tsx", content, "utf8");
  console.log("Successfully added skeleton loading screens!");
} else {
  console.error("Target not found!");
}
