import * as Sentry from "@sentry/nextjs";
import Error from "next/error";

interface ErrorProps {
  statusCode?: number;
}

const CustomErrorComponent = (props: ErrorProps) => {
  return <Error statusCode={props.statusCode ?? 500} />;
};

CustomErrorComponent.getInitialProps = async (contextData: Parameters<typeof Error.getInitialProps>[0]) => {
  // In case this is running in a serverless function, await this in order to give Sentry
  // time to send the error before the lambda exits (only in production)
  if (process.env.NODE_ENV === "production") {
    await Sentry.captureUnderscoreErrorException(contextData);
  }

  // This will contain the status code of the response
  return Error.getInitialProps(contextData);
};

export default CustomErrorComponent;
