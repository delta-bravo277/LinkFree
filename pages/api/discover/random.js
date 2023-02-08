import connectMongo from "../../../config/mongo";
import logger from "../../../config/logger";
import Profile from "../../../models/Profile";
import loadProfiles from "../../../services/profiles/loadProfiles";

export default async function handler(req, res) {
  if (req.method != "GET") {
    return res
      .status(400)
      .json({ error: "Invalid request: GET request required" });
  }

  const { statusCode, data } = await getRandomApi();
  res.status(statusCode).json(data);
}

export async function getRandomApi() {
  await connectMongo();

  let profiles = [];
  try {
    profiles = await Profile.aggregate([
      { $sample: { size: 5 } },
      { $match: { username: { $nin: process.env.SHADOWBAN.split(",") } } },
    ]);
  } catch (e) {
    logger.error(e, "failed to load profiles");
  }

  if (profiles.length === 0) {
    return {
      statusCode: 404,
      data: []
    };
  }

  let fullRandomProfiles = await loadProfiles(profiles);
  fullRandomProfiles = fullRandomProfiles.map((profile) =>{
    return {
      ...profile,
      _id: profile._id.toString(),
    };
  });

  return {
    statusCode: 200,
    data: fullRandomProfiles
  };
}
