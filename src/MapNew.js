import * as React from "react";
import {useCallback, useEffect, useState} from "react";
import {ColumnLayer, GeoJsonLayer, TextLayer} from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import buildingPolygons from "./data/Melbourne_Building_Footprints_MGA.geojson"
import busRoutes from "./data/BusMetroRoutes.geojson"
import tramRoutes from "./data/PTV_METRO_TRAM_ROUTE.json"
import bicycleRoutes from "./data/Melbourne_Bicycle_Routes_MGA.geojson"
import pois from "./data/Melbourne_POIs_MGA.json"
import openSpaces from "./data/Melbourne_OpenSpace_MGA.geojson"
import roads from "./data/Road_Use_Hierarchy.geojson"
import taxiRanks from "./data/TaxiRank.json"
import trainStations from "./data/trainStations.geojson"
import cityCircle from "./data/Melbourne_CityCircle_tram_MGA.json"
import selfGuidedWalks from "./data/SelfGuidedWalks.json"
// import restaurants from "./data/Cafes and restaurants, with seating capacity.geojson"
// import bars from "./data/Bars and pubs, with patron capacity.geojson"
import {StaticMap} from "react-map-gl";
import {scaleLinear, scaleThreshold} from "d3-scale";
import 'mapbox-gl/dist/mapbox-gl.css';
import DirectionsBusFilledTwoToneIcon from '@mui/icons-material/DirectionsBusFilledTwoTone';
import EditRoadTwoToneIcon from '@mui/icons-material/EditRoadTwoTone';
import TramTwoToneIcon from '@mui/icons-material/TramTwoTone';
import Forward30TwoToneIcon from '@mui/icons-material/Forward30TwoTone';
import DirectionsBikeTwoToneIcon from '@mui/icons-material/DirectionsBikeTwoTone';
import PersonPinCircleTwoToneIcon from '@mui/icons-material/PersonPinCircleTwoTone';
import LocationCityTwoToneIcon from '@mui/icons-material/LocationCityTwoTone';
import DeckTwoToneIcon from '@mui/icons-material/DeckTwoTone';
import LocalTaxiTwoToneIcon from '@mui/icons-material/LocalTaxiTwoTone';
import ParkTwoToneIcon from '@mui/icons-material/ParkTwoTone';
import TrainTwoToneIcon from '@mui/icons-material/TrainTwoTone';
import DirectionsWalkTwoToneIcon from '@mui/icons-material/DirectionsWalkTwoTone';
import AnimationTwoToneIcon from '@mui/icons-material/AnimationTwoTone';
import {Grid, SpeedDial, SpeedDialAction, SpeedDialIcon, Stack, ToggleButton, ToggleButtonGroup} from "@mui/material";
import {TripsLayer} from "@deck.gl/geo-layers";

const poi_types = pois.features.map(value => value.properties.Theme)
const WIDTH_SCALE = scaleLinear()
    .clamp(true)
    .domain([0, 200])
    .range([10, 2000]);

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1Ijoicy1sLWEtcy1oIiwiYSI6ImNrdHBiYzVjbzBrejEzMXJybjZkdXVlMjMifQ.3YLGd2ebiKh38Us2SCXbrQ"
export const COLOR_SCALE = scaleThreshold()
    .domain([0, 4, 8, 12, 20, 32, 52, 84, 136, 220])
    .range([
        [26, 152, 80],
        [102, 189, 99],
        [166, 217, 106],
        [217, 239, 139],
        [255, 255, 191],
        [254, 224, 139],
        [253, 174, 97],
        [244, 109, 67],
        [215, 48, 39],
        [168, 0, 0]
    ]);
export const COLOR_SCALE_POI = scaleThreshold()
    .domain([1, 2, 3, 4, 8, 9, 10, 13, 20, 31, 38, 56])
    .range([
        [204, 255, 255],
        [77,255,255],
        [0,209,0],
        [64,128,0],
        [0,128,128],
        [255,255,122],
        [255,209,71],
        [168,190,255],
        [194,71,133],
        [255,0,204],
        [255,0,77],
        [153,0,46]
    ]);

const ICON_MAPPING = {
    marker: {x: 0, y: 0, width: 128, height: 128, mask: true}
};

const INITIAL_VIEW_STATE = {
    latitude: -37.811410792061,
    longitude: 144.950062328321,
    zoom: 12,
    maxZoom: 19,
    pitch: 30,
    bearing: 0,
};
// const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
const MAP_STYLE = 'mapbox://styles/s-l-a-s-h/ckuxpmbmp02m617knixjxcpqx';

const pathEntities = {
    "Buses": {order: 1, icon: <DirectionsBusFilledTwoToneIcon/>},
    "Trams": {order: 2, icon: <TramTwoToneIcon/>},
    "Animated Trams": {order: 14, icon: <AnimationTwoToneIcon/>},
    "Bicycles": {order: 3, icon: <DirectionsBikeTwoToneIcon/>},
    "Roads": {order: 4, icon: <EditRoadTwoToneIcon/>},
    "City Circle": {order: 9, icon: <Forward30TwoToneIcon/>},
    "My Location": {order: 12, icon: <PersonPinCircleTwoToneIcon/>},
    "Self Guided Walks": {order: 13, icon: <DirectionsWalkTwoToneIcon/>}
}
const pointEntities = {
    "Buildings": {order: 0, icon: <LocationCityTwoToneIcon/>},
    "POIs": {order: 5, icon: <DeckTwoToneIcon/>},
    "Open Spaces": {order: 6, icon: <ParkTwoToneIcon/>},
    "Taxi Ranks": {order: 7, icon: <LocalTaxiTwoToneIcon/>},
    "Train Stations": {order: 8, icon: <TrainTwoToneIcon/>},
    // "Bars & Pubs": 10,
    // "Cafes & Restaurants": 11,
}


export default function MapNew({loopLength = 200, animationSpeed = 0.2}) {
    const [pathToggles, setPathToggles] = React.useState(() => []);
    const [pointToggles, setPointToggles] = React.useState(() => [0]);
    const [time, setTime] = useState(0);
    const [hoverInfo, setHoverInfo] = useState("");
    const [tramTime, setTramTime] = useState(0);
    const [animation] = useState({});
    const [currentLoc, setCurrentLoc] = useState();
    navigator.geolocation.getCurrentPosition(position => setCurrentLoc({coordinates: [position.coords.latitude, position.coords.longitude]}))
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const animate = useCallback(() => {
        setTime(t => (t + animationSpeed) % loopLength);
        setTramTime(t => (t + animationSpeed) % loopLength);
        animation.id = window.requestAnimationFrame(animate);
    });
    const getTooltip = ({object}) => (
        object && {
            html: hoverInfo
        }
    )
    useEffect(
        () => {
            animation.id = window.requestAnimationFrame(animate);
            return () => window.cancelAnimationFrame(animation.id);
        },
        [animate, animation]
    );
    const layers = [
        new GeoJsonLayer({
            id: "buildings",
            data: buildingPolygons,
            opacity: 0.8,
            stroked: false,
            filled: true,
            extruded: false,
            wireframe: true,
            getElevation: f => parseInt(f.properties.footprint_max_elevation),
            getFillColor: f => COLOR_SCALE(f.properties.structure_extrusion * 3),
            getLineColor: [255, 255, 255],
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>Tier: ${object.properties.tier}</b></div>
                <div>Property Id: ${object.properties.property_id}</div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'busRoutes',
            data: busRoutes,
            stroked: false,
            filled: false,
            lineWidthMinPixels: 1,
            parameters: {
                depthTest: false
            },
            pointType: 'circle',
            getLineColor: f => COLOR_SCALE((f.properties.OBJECTID_1 - 17) * 10),
            getLineWidth: 6,
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.ROUTE_LONG_NAME}</b></div>
                <div>Route No: ${object.properties.ROUTE_SHORT_NAME}</div>
                <div>Travel Distance: ${object.properties.ROUTE_KM}</div>
                <div>First Station: ${object.properties.FIRST_STOP_NAME}</div>
                <div>Last Station: ${object.properties.LAST_STOP_NAME}</div>
                <div>Total Stops: ${object.properties.NUM_OF_STOPS}</div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'tramRoutes',
            data: tramRoutes,
            stroked: false,
            filled: false,
            lineWidthMinPixels: 1,
            parameters: {
                depthTest: false
            },
            opacity: 0.2,
            pointType: 'circle',
            getLineColor: f => COLOR_SCALE(f.properties.ROUTESHTNM),
            getLineWidth: 6,
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                        <div><b>${object.properties.ROUTELONGN}</b></div>
                        <div>Route No: ${object.properties.ROUTESHTNM}</div>
                        <div>Travel Distance: ${object.properties.ROUTE_KM}</div>
                        <div>First Station: ${object.properties.FIRSTSTNAM}</div>
                        <div>Last Station: ${object.properties.LASTSPNAME}</div>
                        <div>Total Stops: ${object.properties.NUMOFSTOPS}</div>
                    `)
            }
        }),
        // new GeoJsonLayer({
        //     id: 'tramRoutes',
        //     data: tramRoutes,
        //     stroked: false,
        //     filled: false,
        //     lineWidthMinPixels: 0.5,
        //     parameters: {
        //         depthTest: false
        //     },
        //     getLineColor: f => COLOR_SCALE(f.properties.ROUTESHTNM),
        //     getLineWidth: 2,
        //     pickable: true,
        // }),

        new GeoJsonLayer({
            id: 'bicycleRoutes',
            data: bicycleRoutes,
            stroked: false,
            filled: false,
            lineWidthMinPixels: 1,
            parameters: {
                depthTest: false
            },
            getLineColor: f => {
                const type_ = f.properties.type;
                return (type_ === "Informal Bike Route" ? [255, 0, 0] : type_ === "On-Road Bike Lane" ? [0, 255, 0] : [0, 0, 255])
            },
            getLineWidth: 4,
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.name}</b></div>
                <div>Direction: ${object.properties.direction}</div>
                <div>Type: ${object.properties.type}</div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'roadRoutes',
            data: roads,
            stroked: false,
            filled: false,
            lineWidthMinPixels: 0.5,
            parameters: {
                depthTest: false
            },
            getLineColor: f => COLOR_SCALE((f.properties.OBJECTID - 30) * 10),
            getLineWidth: 2,
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.MODE_} Lane</b></div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'pois',
            data: pois,
            pickable: true,
            autoHighlight: true,
            onClick: (info) =>
                // eslint-disable-next-line
                info.object &&
                alert(
                    `${info.object.properties.Theme} (${info.object.properties.Feature_Na})`
                ),
            pointType: 'icon',
            getIconSize: d => 40,
            getIconColor: d => COLOR_SCALE_POI(poi_types.indexOf(d.properties.Theme)),
            getIcon: d => 'marker',
            iconMapping: ICON_MAPPING,
            iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.Feature_Na}</b></div>
                <div>Category: ${object.properties.Theme}</div>
                <div>Sub Category: ${object.properties.Sub_Theme}</div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'openSpaces',
            data: openSpaces,
            opacity: 0.2,
            stroked: false,
            filled: true,
            extruded: false,
            wireframe: true,
            getElevation: f => f.properties.Shape_Length / 100,
            getFillColor: f => COLOR_SCALE(1),
            getLineColor: [255, 255, 255],
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.NAME}</b></div>
                <div>Category: ${object.properties.OS_GROUP}</div>
                <div>Owned By: ${object.properties.OWNER_SUMM}</div>
            `)
            }
        }),
        // new GeoJsonLayer({
        //     id: 'taxiRanks',
        //     data: taxiRanks,
        //     pickable: true,
        //     autoHighlight: true,
        //     extruded: true,
        //     onClick: (info) =>
        //         // eslint-disable-next-line
        //         info.object &&
        //         alert(
        //             `${info.object.properties.loc_desc}`
        //         ),
        //
        //     pointRadiusMinPixels: 2,
        //     pointRadiusScale: 2,
        //     getPointRadius: (f) => f.properties.num_spaces * 1.5,
        //     getFillColor: [200, 0, 80, 180],
        // }),
        new ColumnLayer({
            id: 'taxiRanks',
            data: taxiRanks.features,
            diskResolution: 10,
            radius: 12,
            extruded: true,
            pickable: true,
            elevationScale: 40,
            getPosition: d => d.geometry.coordinates,
            getFillColor: d => WIDTH_SCALE(d.properties.num_spaces),
            getLineColor: [255, 255, 255],
            getElevation: d => parseInt(d.properties.num_spaces),
            opacity: 1,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.loc_desc}</b></div>
                <div>Available Spaces: ${object.properties.num_spaces}</div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'trainStations',
            data: trainStations,
            pickable: true,
            autoHighlight: true,
            onClick: (info) =>
                // eslint-disable-next-line
                info.object &&
                alert(
                    `${info.object.properties.STATIONNAM}`
                ),
            pointType: 'icon',
            getIconSize: d => 40,
            getIconColor: d => COLOR_SCALE(d.properties.STOPMODENA === "Train" ? 20 : 340),
            getIcon: d => 'marker',
            iconMapping: ICON_MAPPING,
            iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.STATIONNAM} Station</b></div>
                <div>Coverage: ${object.properties.ZONES}</div>
            `)
            }
        }),
        new TripsLayer({
            id: 'cityCircleTram',
            data: cityCircle.features,
            getPath: d => d.geometry.coordinates[0],
            getTimestamps: d => d.geometry.coordinates[0].map((v, i) => i),
            getColor: d => COLOR_SCALE(d.properties.route_no),
            opacity: 0.9,
            widthMinPixels: 4,
            gapRounded: false,
            trailLength: 40,
            currentTime: time,
            shadowEnabled: false,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.name}</b></div>
                <div>Route Number: ${object.properties.route_no}</div>
            `)
            }
        }),
        new GeoJsonLayer({
            id: 'bars',
            data: currentLoc,
            pickable: true,
            autoHighlight: true,
            onClick: (info) =>
                // eslint-disable-next-line
                info.object &&
                alert(
                    `${info.object.properties.trading_na}`
                ),
            pointType: 'icon',
            getIconSize: d => 40,
            getIconColor: d => COLOR_SCALE(d.properties.number_of_seats),
            getIcon: d => 'marker',
            iconMapping: ICON_MAPPING,
            iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
        }),
        new GeoJsonLayer({
            id: 'restaurants',
            data: currentLoc,
            pickable: true,
            autoHighlight: true,
            onClick: (info) =>
                // eslint-disable-next-line
                info.object &&
                alert(
                    `${info.object.properties.trading_name}`
                ),
            pointType: 'icon',
            getIconSize: d => 40,
            getIconColor: d => COLOR_SCALE(d.properties.number_of_),
            getIcon: d => 'marker',
            iconMapping: ICON_MAPPING,
            iconAtlas: 'https://raw.githubusercontent.com/visgl/deck.gl-data/master/website/icon-atlas.png',
        }),
        new TextLayer({
            id: 'currentLocation',
            data: currentLoc,
            pickable: true,
            getPosition: d => d.coordinates,
            getText: d => "My Location",
            getSize: 32,
            getAngle: 0,
            getTextAnchor: 'middle',
            getAlignmentBaseline: 'center'
        }),
        new GeoJsonLayer({
            id: 'selfGuidedWalks',
            data: selfGuidedWalks,
            stroked: false,
            filled: false,
            lineWidthMinPixels: 0.5,
            parameters: {
                depthTest: false
            },
            getLineColor: f => COLOR_SCALE(parseInt(f.properties.ref) * 8),
            getLineWidth: 4,
            pickable: true,
            onHover: ({object}) => {
                object && setHoverInfo(`
                <div><b>${object.properties.name}</b></div>
                <div>Walk Duration: ${object.properties.time}</div>
                <div>Walk Distance: ${object.properties.distance} Km</div>
            `)
            }
        }),
        new TripsLayer({
            id: 'animatedTramRoutes',
            data: tramRoutes.features,
            getPath: d => d.geometry.coordinates,
            getTimestamps: d => d.geometry.coordinates.map((v, i) => i),
            getColor: d => COLOR_SCALE(d.properties.ROUTESHTNM),
            opacity: 0.9,
            widthMinPixels: 4,
            gapRounded: false,
            trailLength: 40,
            currentTime: tramTime,
            shadowEnabled: false,
        }),
    ]
    return (
        <div>
            <Grid container sx={{zIndex: "20000"}}>
                <Grid item xs={6} sx={{margin: "auto"}}>
                    {/*<Card elevation={4}>*/}
                    {/*    <CardContent>*/}
                    {/*        */}
                    {/*    </CardContent>*/}
                    {/*</Card>*/}
                    <ToggleButtonGroup
                        sx={{margin: "auto", background: "white"}}
                        value={pointToggles}
                        color={"error"}
                        onChange={(e, i) => setPointToggles(i)}>
                        {Object.entries(pointEntities).map(([k, v], i) => (
                            <ToggleButton key={i} value={v.order}>
                                <Stack direction={"column"} spacing={8} alignItems={"center"}>
                                    {v.icon}
                                    {k}
                                </Stack>
                            </ToggleButton>
                        ))}
                    </ToggleButtonGroup>
                </Grid>
                <SpeedDial
                    ariaLabel="SpeedDial openIcon example"
                    sx={{position: 'absolute', bottom: 16, right: 16}}
                    icon={<SpeedDialIcon/>}
                >
                    {Object.entries(pathEntities).map(([k, v], i) => (
                        <SpeedDialAction key={i} tooltipTitle={k} icon={v.icon} onClick={(event => {
                            if (pathToggles.includes(v.order))
                                setPathToggles(pathToggles.filter((value => value !== v.order)))
                            else
                                setPathToggles([...pathToggles, v.order])
                        })}/>
                    ))}
                </SpeedDial>
            </Grid>
            <DeckGL
                style={{zIndex: -1}}
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                layers={layers.filter((v, i) => [...pathToggles, ...pointToggles].includes(i))}
                getTooltip={getTooltip}
            >
                <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} reuseMaps mapStyle={MAP_STYLE}
                           preventStyleDiffing={true}/>
                {}
            </DeckGL>
        </div>
    )
}
