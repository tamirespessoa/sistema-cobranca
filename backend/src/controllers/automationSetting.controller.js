const prisma = require("../config/prisma");

const {
  processAutomaticReminders
} = require("../services/automaticReminder.service");

async function getAutomationSetting(req, res) {
  try {
    let setting = await prisma.automationSetting.findFirst();

    if (!setting) {
      setting = await prisma.automationSetting.create({
        data: {
          automaticReminders: true,
          automaticEmail: false,
          runHour: 8,
          runMinute: 0
        }
      });
    }

    return res.json(setting);
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);

    return res.status(500).json({
      message: "Erro ao buscar configurações da automação."
    });
  }
}

async function updateAutomationSetting(req, res) {
  try {
    const {
      automaticReminders,
      automaticEmail,
      runHour,
      runMinute
    } = req.body;

    let setting = await prisma.automationSetting.findFirst();

    if (!setting) {
      setting = await prisma.automationSetting.create({
        data: {
          automaticReminders: true,
          automaticEmail: false,
          runHour: 8,
          runMinute: 0
        }
      });
    }

    const updated = await prisma.automationSetting.update({
      where: {
        id: setting.id
      },
      data: {
        automaticReminders,
        automaticEmail,
        runHour: Number(runHour),
        runMinute: Number(runMinute)
      }
    });

    return res.json({
      message: "Configurações atualizadas com sucesso.",
      setting: updated
    });
  } catch (error) {
    console.error("Erro ao atualizar configurações:", error);

    return res.status(500).json({
      message: "Erro ao atualizar configurações da automação."
    });
  }
}

async function runAutomationNow(req, res) {
  try {
    await processAutomaticReminders();

    return res.json({
      message: "Automação executada com sucesso."
    });
  } catch (error) {
    console.error("Erro ao executar automação:", error);

    return res.status(500).json({
      message: "Erro ao executar automação."
    });
  }
}

module.exports = {
  getAutomationSetting,
  updateAutomationSetting,
  runAutomationNow
};