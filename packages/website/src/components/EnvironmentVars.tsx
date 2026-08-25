import { MockIDE } from "performative-ui";
import { useTranslations, type Lang } from "~i18n";

type EnvironmentVarsProps = {
  lang: Lang;
  env?: Record<string, any>;
};

/**
 * The stack's environment, rendered as what it actually is: a config file.
 *
 * Was a `<dl>` with a floated `<dt>` and a fixed 18em column. Now composed
 * from MockIDE's parts — the window chrome and the syntax-coloured body — but
 * *not* `MockIDE.Body`, which types its content one `setTimeout` per
 * character. That is right for a five-line marketing mock and wrong for forty
 * environment variables, so the real content is rendered directly into the
 * body element the library already styles.
 *
 * No disclosure wrapper: the page gives this its own section heading, and a
 * `<details>` under a heading is a second click for something the heading has
 * already promised.
 */
const EnvironmentVars: React.FC<EnvironmentVarsProps> = ({ lang, env }) => {
  const t = useTranslations(lang);
  const entries = Object.entries(env ?? {});

  if (entries.length === 0) {
    return (
      <p
        className="subtle"
        dangerouslySetInnerHTML={{
          __html: t("No environment variables defined."),
        }}
      />
    );
  }

  return (
    <MockIDE>
      <MockIDE.Chrome filename=".env" thinking={false} />
      <pre className="pui-ide__body max-h-96 overflow-y-auto">
        {entries.map(([key, value]) => (
          <span key={key}>
            <span className="pui-tok-key">{key}</span>
            <span className="pui-tok-com">=</span>
            <span className="pui-tok-str">{String(value)}</span>
            {"\n"}
          </span>
        ))}
      </pre>
    </MockIDE>
  );
};

export default EnvironmentVars;
