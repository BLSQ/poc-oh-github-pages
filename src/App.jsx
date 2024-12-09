import { useEffect, useState } from "react";
import "./App.css";

async function fetchPyramidLevel(level) {
  const response = await fetch(
    "https://hexa-app-ssc-public.s3.eu-central-1.amazonaws.com/public/pyramid-level-" +
      level +
      ".csv"
  );
  const csvText = await response.text();
  const results = Papa.parse(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return await results;
}

const PdfLink = ({ orgUnit, period }) => {
  const [status, setStatus] = useState("checking");
  const documentUrl =
    "https://hexa-app-ssc-public.s3.eu-central-1.amazonaws.com/public/bulletins/" +
    period +
    "/IHP_SSC_monthly_bulletin_" +
    orgUnit.ID +
    "_" +
    period +
    ".pdf";

  useEffect(() => {
    const checkStatus = async () => {
      const response = await fetch(documentUrl, { method: "HEAD" }); // Send a HEAD request to prefetch the URL and see if pdf exist
      if (response.status === 403) {
        setStatus("pas encore disponible");
      } else {
        setStatus("disponible");
      }
    };
    checkStatus();
  }, [documentUrl]);

  return (
    <span>
      <a href={documentUrl}>PDF</a>{" "}
      <span
        style={{
          color:
            status == "disponible"
              ? "green"
              : status == "pas encore disponible"
              ? "orange"
              : "lightgrey",
        }}
      >
        &nbsp;&nbsp;{status}
      </span>
    </span>
  );
};

const ReportSelect = () => {
  return (
    <select disabled>
      <option>Rapport Mensuel des sites de Soins Communautaires</option>
    </select>
  );
};

const PeriodSelect = ({ onChange }) => {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1; // Months are 0-based
  const currentYearMonth = `${currentYear}${currentMonth
    .toString()
    .padStart(2, "0")}`;
  const options = [];
  for (let year = currentYear - 1; year <= currentYear + 1; year++) {
    for (let month = 1; month <= 12; month++) {
      const yearMonth = `${year}${month.toString().padStart(2, "0")}`;
      const option = (
        <option id={yearMonth} key={yearMonth}>
          {yearMonth}
        </option>
      );
      if (yearMonth <= currentYearMonth) {
        options.push(option);
      }
    }
  }

  options.reverse();
  useEffect(() => {
    onChange(currentYearMonth);
  }, []);

  return (
    <select
      defaultValue={currentYearMonth}
      onChange={(e) => onChange(e.target.value)}
    >
      {options}
    </select>
  );
};

const LevelSelect = ({ level, onChange, filter }) => {
  const [options, setOptions] = useState();
  useEffect(() => {
    fetchPyramidLevel(level).then((opts) => {
      const data = filter ? opts.data.filter(filter) : opts.data;
      data.sort((a, b) => {
        if (a.OU_NAME < b.OU_NAME) return -1;
        if (a.OU_NAME > b.OU_NAME) return 1;
        return 0;
      });
      setOptions(data.filter((a) => a.OU_NAME && a.OU_NAME != ""));
      onChange(data[0]);
    });
  }, [level]);
  const onSelectChange = (e) => {
    const selectedValue = options[e.target.selectedIndex];
    onChange(selectedValue);
  };
  return (
    <select onChange={onSelectChange} autoComplete="on">
      {options &&
        options.map((o) => (
          <option key={o.ID} id={o.ID}>
            {o.OU_NAME}
          </option>
        ))}
    </select>
  );
};

function App() {
  const [selectedLevels, setSelectedLevels] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(undefined);

  return (
    <div id="container">
      <div style={{ textAlign: "left" }}>
        <ReportSelect />
        <PeriodSelect onChange={(period) => setSelectedPeriod(period)} />
        <LevelSelect
          level={2}
          onChange={(sel) => {
            setSelectedLevels({
              2: sel,
            });
          }}
        />
        {selectedLevels[2] && (
          <PdfLink orgUnit={selectedLevels[2]} period={selectedPeriod} />
        )}
        {selectedLevels[2] && (
          <LevelSelect
            key={selectedLevels[2].ID}
            level={3}
            filter={(ou) => ou.PARENT_ID == selectedLevels[2].ID}
            onChange={(sel) => {
              setSelectedLevels({
                ...selectedLevels,
                3: sel,
              });
            }}
          />
        )}
        {selectedLevels[3] && (
          <PdfLink orgUnit={selectedLevels[3]} period={selectedPeriod} />
        )}
      </div>
    </div>
  );
}

export default App;
