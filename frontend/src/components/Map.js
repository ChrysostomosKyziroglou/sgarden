import React, { useEffect, useRef, useState } from "react";
import {
	ComposableMap,
	Geographies,
	Geography,
	Annotation,
	Graticule,
	Line,
	Marker,
} from "react-simple-maps";
import { memo } from "react";

import colors from "../_colors.scss";
import { Grid } from "@mui/material";

/*
	Projection types:
		geoEqualEarth — Equal Earth projection
		geoAlbers — Albers projection
		geoAlbersUsa — Albers USA composite projection
		geoAzimuthalEqualArea — Azimuthal Equal Area projection
		geoAzimuthalEquidistant — Azimuthal Equidistant projection
		geoOrthographic — Orthographic projection
		geoConicConformal — Conic Conformal projection
		geoConicEqualArea — Conic Equal Area projection
		geoConicEquidistant — Conic Equidistant projection
		geoStereographic — Stereographic projection
		geoMercator — Mercator projection
		geoTransverseMercator - Transverse Mercator projection

	Scale: 1 to 1000
	Center: [longitude, latitude]
	Rotate: [longitude, latitude, roll]

	countriesFill:
		- String: color for all countries
		- Object: { "Country Name": color, default: color }

	countriesFillHover:
		- String: color for all countries
		- Object: { "Country Name": color, default: color }

	countriesFillPressed:
		- String: color for all countries
		- Object: { "Country Name": color, default: color }

	countriesStroke:
		- String: color for all countries
		- Object: { "Country Name": color, default: color }

	countriesStrokeWidth:
		- Number: stroke width for all countries
		- Object: { "Country Name": stroke width, default: stroke width }

	guides:
		- Object: { back: false, front: false, fill: "color", stroke: "color", step: [longitude, latitude] }
*/

const Map = ({
	width = "100%",
	height = "100%",
	projection = "geoEqualEarth",
	scale = 200,
	center = [0, 0],
	rotate = [0, 0, 0],
	countriesFill = { Greece: colors.primary, Germany: colors.primary, France: colors.primary, default: colors.secondary },
	countriesFillHover = "red",
	countriesFillPressed = countriesFill,
	countriesStroke = "white",
	countriesStrokeWidth = 0.5,
	guides = { back: false, front: true, fill: "transparent", stroke: "white", step: [20, 20] },
	lines = [],
	markers = [{ coordinates: [-101, 53], fill: "red" }],
	annotations = [
		{
			subject: [2.3522, 48.8566],
			dx: -90,
			dy: -30,
			label: "Paris",
			stroke: "#FF5533",
			fill: "#F53",
		},
	],
}) => {
	const [mapWidth, setMapWidth] = useState(0);
	const [mapHeight, setMapHeight] = useState(0);
	const containerRef = useRef(null);

	useEffect(() => {
		if (containerRef.current) {
			const { width: containerWidth, height: containerHeight } = containerRef.current.getBoundingClientRect();
			setMapWidth(containerWidth);
			setMapHeight(containerHeight);
		}
	}, []);

	return (
		<Grid ref={containerRef} style={{ width, height }}>
			<ComposableMap
				width={mapWidth}
				height={mapHeight}
				projection={projection}
				projectionConfig={{
					rotate,
					scale,
					center,
				}}
			>
				{guides?.back && <Graticule {...guides} />}

				<Geographies geography="/map.json">
					{({ geographies }) =>
						geographies.map((geo) => (
							<Geography
								key={geo.rsmKey}
								geography={geo}
								stroke={
									typeof countriesStroke === "string"
										? countriesStroke
										: countriesStroke[geo.properties.name] || countriesStroke?.default || "white"
								}
								strokeWidth={
									typeof countriesStrokeWidth === "number"
										? countriesStrokeWidth
										: countriesStrokeWidth[geo.properties.name] || countriesStrokeWidth?.default || 0.5
								}
								style={{
									default: {
										fill:
											typeof countriesFill === "string"
												? countriesFill
												: countriesFill[geo.properties.name] || countriesFill?.default || "black",
									},
									hover: {
										fill:
											typeof countriesFillHover === "string"
												? countriesFillHover
												: countriesFillHover[geo.properties.name] || countriesFillHover?.default || "black",
									},
									pressed: {
										fill:
											typeof countriesFillPressed === "string"
												? countriesFillPressed
												: countriesFillPressed[geo.properties.name] || countriesFillPressed?.default || "black",
									},
								}}
							/>
						))
					}
				</Geographies>

				{guides?.front && <Graticule {...guides} />}

				{lines.map((line, index) => (
					<Line
						key={`line-${index}`}
						from={line.from}
						to={line.to}
						stroke={line.stroke}
						strokeWidth={line.strokeWidth}
						strokeLinecap={line.strokeLinecap}
					/>
				))}

				{markers.map((marker, index) => (
					<Marker
						key={`marker-${index}`}
						coordinates={marker.coordinates}
						style={{
							default: { fill: marker.fill || "red" },
							hover: { fill: marker.hover || "blue" },
							pressed: { fill: marker.pressed || "orange" },
						}}
					>
						<circle r={8} fill={marker.fill || "#F53"} />
					</Marker>
				))}

				{annotations.map((annotation, index) => (
					<Annotation
						key={`annotation-${index}`}
						subject={annotation.subject}
						dx={annotation.dx}
						dy={annotation.dy}
						connectorProps={{
							stroke: annotation.stroke || "#FF5533",
							strokeWidth: annotation.strokeWidth || 3,
							strokeLinecap: "round",
						}}
					>
						<text
							x="-8"
							textAnchor="end"
							alignmentBaseline="middle"
							fill={annotation.fill || "#F53"}
						>
							{annotation.label}
						</text>
					</Annotation>
				))}
			</ComposableMap>
		</Grid>
	);
};

export default memo(Map);