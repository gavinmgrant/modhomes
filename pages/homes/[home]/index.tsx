import dynamic from "next/dynamic";
import React, {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  useState,
} from "react";
import type { GetStaticPaths, GetStaticProps } from "next";
import { NextRouter, useRouter } from "next/router";
import HomeModel from "../../../components/homemodel";
import NavBar from "../../../components/navbar";
import {
  getApplianceSpots,
  getSidedPanes,
  hasGalley,
  hasServices,
} from "../../../components/services";
import { SpecsToggle } from "../../../components/hotspots";
import {
  createFacingStore,
  DeckSide,
  DeckToggle,
  getDecksLength,
  getDecksWidth,
  isDeckMoving,
} from "../../../components/deck";
import Colors from "../../../components/colors";
import Materials from "../../../components/materials";
import ModelCard from "../../../components/modelcard";
import PageMeta from "../../../components/pagemeta";
import ViewNotice from "../../../components/viewnotice";
import ControlDock from "../../../components/controldock";
import InsideScene from "../../../components/insidescene";
import OutsideScene from "../../../components/outsidescene";
import {
  WalkPad,
  Joystick,
  WalkInput,
  IDLE_INPUT,
} from "../../../components/walkcontrols";
import {
  SiteAddress,
  SiteNotice,
  SiteToggle,
  useSiteView,
} from "../../../components/sitemap";
import MODELS, { findModel, Model } from "../../../lib/models";
import {
  loadInsideView,
  parseView,
  saveInsideView,
  toViewParam,
} from "../../../lib/viewposition";
import { getQuote } from "../../../lib/pricing";
import { useIsMobile, useIsTouch } from "../../../lib/media";
import {
  INITIAL_VIEWER,
  pickFinish,
  SetFinish,
  viewerReducer,
} from "../../../lib/viewerstate";
import {
  getConfigPath,
  parseConfig,
  serializeConfig,
  toQueryString,
} from "../../../lib/homeconfig";

// Writes the query in place, without adding to the history or fetching the
// page again
const replaceQuery = (router: NextRouter, slug: string, search: string) =>
  router.replace(`/homes/${slug}${search ? `?${search}` : ""}`, undefined, {
    shallow: true,
    scroll: false,
  });

const SiteCredits = dynamic(
  () => import("../../../components/sitetiles").then((m) => m.SiteCredits),
  { ssr: false },
);

const COUNTS = ["one", "two", "three", "four", "five", "six", "seven", "eight"];
const NUMBER = new Intl.NumberFormat("en-US");

// e.g. "Mod 3x2 is a 1,920 sq ft, two-story modular home built from six modules…"
const describeModel = ({ name, area, cols, stories }: Model) => {
  const modules = cols * stories;
  const story = stories === 2 ? "two-story" : "single-story";
  const built =
    modules === 1 ? "a single module" : `${COUNTS[modules - 1]} modules`;
  return `${name} is a ${NUMBER.format(
    area,
  )} sq ft, ${story} modular home built from ${built}. Orbit it in 3D, try an exterior color, or step inside to walk through and choose a floor finish.`;
};

// Prerendering each model puts its title and share card in the page's HTML
export const getStaticPaths: GetStaticPaths = () => ({
  paths: MODELS.map((model) => ({ params: { home: model.slug } })),
  fallback: false,
});

type HomesProps = { slug: string };

export const getStaticProps: GetStaticProps<HomesProps> = ({ params }) => ({
  props: { slug: String(params?.home) },
});

const Homes = ({ slug }: HomesProps) => {
  const [viewer, dispatch] = useReducer(viewerReducer, INITIAL_VIEWER);
  const { isInside, finishes, decks, showSpecs, openAppliance } = viewer;
  const [facing] = useState(createFacingStore);
  const site = useSiteView();
  // The dock, which the site's credits keep clear of
  const dock = useRef<HTMLDivElement>(null);
  const walkInput = useRef<WalkInput>({ ...IDLE_INPUT });
  const isMobile = useIsMobile();
  const isTouch = useIsTouch();

  // Whether the URL still carries the view a link opened, e.g. ?view=inside.
  // It stays through picking finishes, while it's still the view on screen,
  // and switching views drops it (below), so the URL never names a view
  // that isn't showing, and a reload then follows local storage again
  const linkedView = useRef(false);

  // Opens the view the URL names, or else the one used last. The query is
  // read from the address bar rather than the router, which only has it a
  // render later, so the page doesn't draw one view and then swap to the
  // other. A linked view counts as used, so local storage keeps up with it
  useEffect(() => {
    const query = Object.fromEntries(
      new URLSearchParams(window.location.search),
    );
    const inside = loadInsideView(query);
    dispatch({ type: "view", inside });
    if (parseView(query) !== undefined) {
      linkedView.current = true;
      saveInsideView(inside);
    }
  }, []);

  // The URL's query carries the finishes and decks, so a configured home
  // can be reloaded, shared and taken to the checkout. The page is
  // prerendered without a query, which arrives once the router is ready
  const router = useRouter();
  const config = toQueryString(serializeConfig({ finishes, decks }));
  const urlConfig = router.isReady
    ? toQueryString(serializeConfig(parseConfig(router.query)))
    : null;
  const latest = useRef({ router, slug, urlConfig, isInside });
  latest.current = { router, slug, urlConfig, isInside };

  // Opens the home the URL asks for, and again whenever the URL changes
  // other than by the effect below: going back, or to another model
  useEffect(() => {
    if (urlConfig === null || urlConfig === config) return;
    const query = Object.fromEntries(new URLSearchParams(urlConfig));
    dispatch({ type: "load", ...parseConfig(query) });
    // Only the URL changing loads it; picking a finish changes the URL
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlConfig]);

  // Writes each change to the URL, keeping a linked view, which is never
  // added otherwise. It skips its first run, when nothing's been picked yet
  const lastConfig = useRef(config);
  useEffect(() => {
    if (config === lastConfig.current) return;
    lastConfig.current = config;
    const { router, slug, urlConfig, isInside } = latest.current;
    if (urlConfig === null || config === urlConfig) return;
    const view = linkedView.current ? toViewParam(isInside) : "";
    replaceQuery(router, slug, [config, view].filter(Boolean).join("&"));
  }, [config]);

  // The checkout is rendered on the server, so it can take a moment to
  // arrive after Reserve is clicked. The view says so meanwhile, from the
  // route change starting until it lands or fails
  const [reserving, setReserving] = useState(false);
  const { events } = router;
  useEffect(() => {
    const start = (url: string) => {
      if (url.split("?")[0].endsWith("/checkout")) setReserving(true);
    };
    const stop = () => setReserving(false);
    events.on("routeChangeStart", start);
    events.on("routeChangeComplete", stop);
    events.on("routeChangeError", stop);
    return () => {
      events.off("routeChangeStart", start);
      events.off("routeChangeComplete", stop);
      events.off("routeChangeError", stop);
    };
  }, [events]);

  // The same function every render, so the memoized home only re-renders
  // when its own props change
  const handleDeckSettled = useCallback(
    (side: DeckSide) => dispatch({ type: "settleDeck", side }),
    [],
  );

  // The paths are the models, so the slug always names one
  const model = findModel(slug);
  if (!model) return null;
  const { cols, stories } = model;

  // Swaps the canvas in place; the keyed wrappers below remount it with a
  // fresh camera
  const handleViewChange = (inside: boolean) => {
    dispatch({ type: "view", inside });
    walkInput.current = { ...IDLE_INPUT };
    saveInsideView(inside);
    // The linked view is no longer the one showing, so it leaves the URL
    if (linkedView.current) {
      linkedView.current = false;
      if (router.isReady) replaceQuery(router, slug, config);
    }
  };

  const setFinish: SetFinish = (key, value) => dispatch(pickFinish(key, value));

  const home = (
    <HomeModel
      cols={cols}
      stories={stories}
      color={finishes.metal}
      floorMaterial={finishes.floor}
      trimColor={finishes.trim}
      sidingColor={finishes.wood}
      tileColor={finishes.tile}
      decks={decks}
      onDeckSettled={handleDeckSettled}
    />
  );
  // The wood swatch colors the decks as well as the siding
  const hasWood =
    getSidedPanes(cols, stories).length > 0 || Object.keys(decks).length > 0;
  const hasTile = hasServices(cols) || hasGalley(cols);
  const hasAppliances = getApplianceSpots(cols).length > 0;

  return (
    <>
      <PageMeta
        title={`${model.name} · ${NUMBER.format(
          model.area,
        )} sq ft modular home | ModHomes`}
        description={describeModel(model)}
        path={`/homes/${model.slug}`}
        image={`/og/${model.slug}.png`}
        imageAlt={`3D render of the ${model.name} modular home`}
      />
      <div
        style={{ position: "relative", maxWidth: "1200px", margin: "0 auto" }}
      >
        <NavBar
          center={
            site.available && <SiteAddress shown={site.ready && !isInside} />
          }
        />
        <ModelCard
          model={{
            ...model,
            footprint: [
              model.footprint[0] + getDecksWidth(decks),
              model.footprint[1] + getDecksLength(decks),
            ],
            // As configured, so it follows every finish and deck
            price: getQuote({ cols, stories, finishes, decks }).total,
          }}
          reserveHref={getConfigPath(slug, { finishes, decks }, "checkout")}
        />
      </div>
      <div
        style={{
          height: "100vh",
          width: "100vw",
          margin: 0,
          // The site's notice and credits sit over the canvas, within this
          position: "relative",
          isolation: "isolate",
        }}
      >
        {reserving && (
          <ViewNotice loading>Preparing your reservation…</ViewNotice>
        )}
        {site.available && (
          // Gives way to the reservation's notice, in the same spot
          <SiteNotice
            status={site.status}
            shown={site.on && !isInside && !reserving}
          />
        )}
        {site.available && (
          <SiteCredits shown={site.ready && !isInside} dock={dock} />
        )}
        {isInside ? (
          // Keyed by model too, so switching models from the menu starts the
          // new one at its own corner rather than wherever the last one ended
          <div key={`inside-${slug}`} className="viewer-fade">
            <InsideScene
              cols={cols}
              stories={stories}
              walkInput={walkInput}
              showSpecs={showSpecs}
              openAppliance={openAppliance}
              onOpenAppliance={(appliance) =>
                dispatch({ type: "openAppliance", appliance })
              }
            >
              {home}
            </InsideScene>
          </div>
        ) : (
          <div key="outside" className="viewer-fade">
            <OutsideScene
              cols={cols}
              stories={stories}
              decksMoving={isDeckMoving(decks)}
              facing={facing}
              site={site}
            >
              {home}
            </OutsideScene>
          </div>
        )}

        <div
          style={{
            position: "relative",
            maxWidth: "1200px",
            margin: "0 auto",
          }}
        >
          {isInside &&
            (isTouch ? (
              <Joystick input={walkInput} />
            ) : (
              <WalkPad input={walkInput} />
            ))}

          <ControlDock
            dockRef={dock}
            isInside={isInside}
            onViewChange={handleViewChange}
            label={isInside ? "Interior finishes" : "Exterior colors"}
            aside={
              isInside ? (
                hasAppliances && (
                  <SpecsToggle
                    on={showSpecs}
                    onChange={(on) => dispatch({ type: "specs", on })}
                  />
                )
              ) : (
                <div style={{ display: "flex", gap: isMobile ? 8 : 6 }}>
                  <DeckToggle
                    decks={decks}
                    facing={facing}
                    onToggle={(side) => dispatch({ type: "toggleDeck", side })}
                  />
                  {site.available && (
                    <SiteToggle
                      on={site.on}
                      status={site.status}
                      onChange={site.setOn}
                    />
                  )}
                </div>
              )
            }
          >
            {isInside ? (
              <Materials
                finishes={finishes}
                onChange={setFinish}
                hasTile={hasTile}
              />
            ) : (
              <Colors
                finishes={finishes}
                onChange={setFinish}
                hasWood={hasWood}
              />
            )}
          </ControlDock>
        </div>
      </div>
    </>
  );
};

export default Homes;
