import { useTranslations, type Lang } from "~i18n";

type EnvironmentVarsProps = {
  lang: Lang;
  env?: Record<string, any>;
};

const EnvironmentVars: React.FC<EnvironmentVarsProps> = ({ lang, env }) => {
  const t = useTranslations(lang);

  return Object.entries(env ?? {}).length === 0 ? (
    <p
      className="subtle"
      dangerouslySetInnerHTML={{
        __html: t("No environment variables defined."),
      }}
    />
  ) : (
    <details>
      <summary
        className="subtle"
        dangerouslySetInnerHTML={{
          __html: t("View environment variables"),
        }}
      />
      <dl className="max-h-96 overflow-y-auto">
        {Object.entries(env ?? {}).map(([key, value]) => (
          <>
            <dt>{key}</dt>
            <dd>
              <span style={{ userSelect: "none", WebkitUserSelect: "none" }}>
                &nbsp;
              </span>
              {value}
            </dd>
          </>
        ))}
      </dl>
    </details>
  );
};

export default EnvironmentVars;
