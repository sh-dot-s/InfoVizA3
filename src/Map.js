import * as React from "react";
import {useEffect, useState} from "react";
import {GeoJsonLayer} from '@deck.gl/layers';
import DeckGL from '@deck.gl/react';
import buildingPolygons from "./data/Melbourne_Building_Footprints_MGA.geojson"
// import dataBuildings from "./data/BusMetroRoutes.geojson"
import dataBuildings from "./PTV_METRO_TRAM_ROUTE.json"
import {StaticMap} from "react-map-gl";
import {scaleThreshold} from "d3-scale";
import {TripsLayer} from '@deck.gl/geo-layers';
import 'mapbox-gl/dist/mapbox-gl.css';
import {Button, Card, Divider, Stack} from "@mui/material";


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


const INITIAL_VIEW_STATE = {
    latitude: -37.811410793061,
    longitude: 144.990082328321,
    zoom: 11,
    maxZoom: 19,
    pitch: 30,
    bearing: 0,
};

const MAP_STYLE = 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';


export default function Map({loopLength = 200, animationSpeed = 0.2}) {

    const [time, setTime] = useState(0);
    const [animation] = useState({});

    const animate = () => {
        setTime(t => (t + animationSpeed) % loopLength);
        animation.id = window.requestAnimationFrame(animate);
    };

    useEffect(
        () => {
            animation.id = window.requestAnimationFrame(animate);
            return () => window.cancelAnimationFrame(animation.id);
        },
        [animation]
    );
    const [elevation, setElevation] = useState(5)
    return (
        <div>
            <Card elevation={2}>
                <Stack
                    direction="row"
                    divider={<Divider orientation="vertical" flexItem/>}
                    spacing={2}
                    sx={{mb: 4, zIndex: "18423"}}
                >
                    {["Bus", "Tram", "Train", "Bicycle", "POI"].map((v, idx) => (
                        <Button key={idx} variant={"text"} sx={{cursor: "pointer"}}>{v}</Button>
                    ))}
                </Stack>
            </Card>
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                layers={
                    [
                        new GeoJsonLayer({
                            data: buildingPolygons,
                            // pickable: true,
                            opacity: 0.9,
                            stroked: false,
                            filled: true,
                            extruded: true,
                            wireframe: true,
                            getElevation: 100,
                            getFillColor: f => COLOR_SCALE(f.properties.structure_extrusion),
                            getLineColor: [255, 255, 255],

                        }),
                        new TripsLayer({
                            id: 'trips',
                            data: dataBuildings.features,
                            getPath: d => d.geometry.coordinates,
                            getTimestamps: d => d.geometry.coordinates.map((v, i) => i),
                            getColor: d => COLOR_SCALE(d.properties.ROUTESHTNM),
                            opacity: 0.3,
                            widthMinPixels: 2,
                            gapRounded: false,
                            trailLength: 100,
                            currentTime: time,
                            shadowEnabled: false
                        }),
                        // new GeoJsonLayer({
                        //     id: "tram",
                        //     data: dataBuildings,
                        //     stroked: false,
                        //     filled: false,
                        //     onHover: ({object}) =>
                        //         object && `${object.properties.TRIPHDSIGN}`,
                        //     lineWidthMinPixels: 1,
                        //     parameters: {
                        //         depthTest: false
                        //     },
                        //     getLineColor: d => COLOR_SCALE(d.properties.ROUTE_SHORT_NAME)
                        // })
                    ]
                }
            >
                <StaticMap mapboxApiAccessToken={MAPBOX_ACCESS_TOKEN} mapStyle={MAP_STYLE}
                />
                {/*<Slider defaultValue={10} onChange={(e) => setElevation(e.target.value)} step={10} marks min={1}*/}
                {/*        max={100}/>*/}
            </DeckGL>
        </div>
    )
}
